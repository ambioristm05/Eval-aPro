import { ACADEMIC_STATUSES } from '../constants/academicHierarchy.constants.js';
import { Class as AcademicClass } from '../models/Class.js';
import { Module as AcademicModule } from '../models/Module.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

async function findModuleForEvaluator(req, id) {
  const module = await AcademicModule.findOne({
    _id: id,
    evaluator: req.user._id
  }).populate('course', 'name description status');

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
  const { name, description, status, order } = req.validated.body;

  if (name !== undefined) module.name = name;
  if (description !== undefined) module.description = description;
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
    const classResult = await AcademicClass.updateMany(
      { module: module._id, evaluator: req.user._id, status: ACADEMIC_STATUSES.ACTIVE },
      { $set: { status: ACADEMIC_STATUSES.ARCHIVED } }
    );
    classesArchived = classResult.modifiedCount ?? 0;
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
      evaluator: req.user._id
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
