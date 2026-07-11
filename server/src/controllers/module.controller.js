import { ACADEMIC_STATUSES } from '../constants/academicHierarchy.constants.js';
import { USER_ROLES } from '../constants/user.constants.js';
import { Class as AcademicClass } from '../models/Class.js';
import { Module as AcademicModule } from '../models/Module.js';
import { Task } from '../models/Task.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { bulkArchive } from '../utils/cascadeArchive.js';
import { writeAudit } from '../utils/audit.js';

async function findModuleForEvaluator(req, id) {
  const filter = { _id: id };
  if (req.user.role !== USER_ROLES.ADMIN) filter.evaluator = req.user._id;

  const module = await AcademicModule.findOne(filter).populate('course', 'name description status');

  if (!module) {
    throw new AppError('Módulo no encontrado', 404);
  }

  return module;
}

function applySearch(filter, search) {
  if (search) filter.name = { $regex: search, $options: 'i' };
  return filter;
}

export const getModuleById = asyncHandler(async (req, res) => {
  const module = await findModuleForEvaluator(req, req.validated.params.id);

  res.json({ module });
});

export const updateModule = asyncHandler(async (req, res) => {
  const module = await findModuleForEvaluator(req, req.validated.params.id);
  const { name, description, startDate, endDate, status, order } = req.validated.body;

  if (name !== undefined) module.name = name;
  if (description !== undefined) module.description = description;
  if (startDate !== undefined) module.startDate = startDate;
  if (endDate !== undefined) module.endDate = endDate;
  if (status !== undefined) module.status = status;
  if (order !== undefined) module.order = order;

  await module.save();

  res.json({ module });
});

export const deleteModule = asyncHandler(async (req, res) => {
  const module = await findModuleForEvaluator(req, req.validated.params.id);
  const cascade = req.validated.query?.cascade;
  const activeClasses = await AcademicClass.countDocuments({
    module: module._id,
    evaluator: req.user._id,
    status: ACADEMIC_STATUSES.ACTIVE
  });

  if (activeClasses > 0 && !cascade) {
    throw new AppError('No puedes archivar un módulo con clases activas', 409);
  }

  let classesArchived = 0;

  if (activeClasses > 0 && cascade) {
    classesArchived = await bulkArchive(AcademicClass, { module: module._id, evaluator: req.user._id });
  }

  module.status = ACADEMIC_STATUSES.ARCHIVED;
  await module.save();

  res.json({
    message: 'Módulo archivado correctamente',
    module,
    cascade: { classesArchived }
  });
});

export const getModuleClasses = asyncHandler(async (req, res) => {
  const module = await findModuleForEvaluator(req, req.validated.params.moduleId);
  const { search, status, page, limit } = req.validated.query;
  const filter = applySearch(
    {
      module: module._id,
      course: module.course._id || module.course,
      ...(req.user.role !== USER_ROLES.ADMIN ? { evaluator: req.user._id } : {})
    },
    search
  );

  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [classes, total] = await Promise.all([
    AcademicClass.find(filter).sort({ order: 1, createdAt: 1 }).skip(skip).limit(limit),
    AcademicClass.countDocuments(filter)
  ]);

  res.json({
    classes,
    module,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const createClassForModule = asyncHandler(async (req, res) => {
  const module = await findModuleForEvaluator(req, req.validated.params.moduleId);
  const { name, description, status, order } = req.validated.body;

  const academicClass = await AcademicClass.create({
    name,
    description,
    status,
    order,
    module: module._id,
    course: module.course._id || module.course,
    evaluator: req.user._id
  });

  res.status(201).json({ class: academicClass, module });
});

export const deleteModulePermanent = asyncHandler(async (req, res) => {
  const module = await AcademicModule.findById(req.validated.params.id).populate('course', 'name description status');
  if (!module) {
    throw new AppError('Módulo no encontrado', 404);
  }

  const cascade = req.validated.query?.cascade;
  const classIds = await AcademicClass.find({ module: module._id }).distinct('_id');
  const taskCount = await Task.countDocuments({ class: { $in: classIds } });

  if ((classIds.length > 0 || taskCount > 0) && !cascade) {
    throw new AppError('Este módulo tiene clases o tareas asociadas. Confirma la eliminación en cascada.', 409);
  }

  const [tasksDeleted, classesDeleted] = await Promise.all([
    Task.deleteMany({ class: { $in: classIds } }),
    AcademicClass.deleteMany({ module: module._id })
  ]);

  await AcademicModule.deleteOne({ _id: module._id });

  const cascadeCounts = {
    classes: classesDeleted.deletedCount ?? 0,
    tasks: tasksDeleted.deletedCount ?? 0
  };

  await writeAudit({
    actor: req.user._id,
    action: 'module.permanentDelete',
    entity: 'Module',
    entityId: module._id,
    before: module.toObject(),
    after: null,
    metadata: { cascade: cascadeCounts }
  });

  res.json({
    message: 'Módulo eliminado de forma definitiva',
    cascade: cascadeCounts
  });
});
