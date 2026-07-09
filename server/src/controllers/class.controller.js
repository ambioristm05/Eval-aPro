import { ACADEMIC_STATUSES } from '../constants/academicHierarchy.constants.js';
import { USER_ROLES } from '../constants/user.constants.js';
import { Class as AcademicClass } from '../models/Class.js';
import { Task } from '../models/Task.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAudit } from '../utils/audit.js';

async function findClassForEvaluator(req, id) {
  const filter = { _id: id };
  if (req.user.role !== USER_ROLES.ADMIN) filter.evaluator = req.user._id;

  const academicClass = await AcademicClass.findOne(filter)
    .populate('course', 'name description status')
    .populate('module', 'name description status order');

  if (!academicClass) {
    throw new AppError('Clase no encontrada', 404);
  }

  return academicClass;
}

export const getClassById = asyncHandler(async (req, res) => {
  const academicClass = await findClassForEvaluator(req, req.validated.params.id);

  res.json({ class: academicClass });
});

export const updateClass = asyncHandler(async (req, res) => {
  const academicClass = await findClassForEvaluator(req, req.validated.params.id);
  const { name, description, status, order } = req.validated.body;

  if (name !== undefined) academicClass.name = name;
  if (description !== undefined) academicClass.description = description;
  if (status !== undefined) academicClass.status = status;
  if (order !== undefined) academicClass.order = order;

  await academicClass.save();

  res.json({ class: academicClass });
});

export const deleteClass = asyncHandler(async (req, res) => {
  const academicClass = await findClassForEvaluator(req, req.validated.params.id);
  const cascade = req.validated.query?.cascade;
  const linkedTasks = await Task.countDocuments({
    class: academicClass._id,
    evaluator: req.user._id
  });

  if (linkedTasks > 0 && !cascade) {
    throw new AppError('No puedes archivar una clase con tareas asociadas', 409);
  }

  academicClass.status = ACADEMIC_STATUSES.ARCHIVED;
  await academicClass.save();

  res.json({
    message: 'Clase archivada correctamente',
    class: academicClass,
    // A class has no lower level to cascade-archive into (tasks don't have an
    // archived state of their own) — `linkedTasks` is informational only, it
    // does NOT mean those tasks were modified.
    linkedTasks
  });
});

export const deleteClassPermanent = asyncHandler(async (req, res) => {
  const academicClass = await AcademicClass.findById(req.validated.params.id)
    .populate('course', 'name description status')
    .populate('module', 'name description status order');

  if (!academicClass) {
    throw new AppError('Clase no encontrada', 404);
  }

  const cascade = req.validated.query?.cascade;
  const taskCount = await Task.countDocuments({ class: academicClass._id });

  if (taskCount > 0 && !cascade) {
    throw new AppError('Esta clase tiene tareas asociadas. Confirma la eliminación en cascada.', 409);
  }

  const tasksDeleted = await Task.deleteMany({ class: academicClass._id });
  await AcademicClass.deleteOne({ _id: academicClass._id });

  const cascadeCounts = { tasks: tasksDeleted.deletedCount ?? 0 };

  await writeAudit({
    actor: req.user._id,
    action: 'class.permanentDelete',
    entity: 'Class',
    entityId: academicClass._id,
    before: academicClass.toObject(),
    after: null,
    metadata: { cascade: cascadeCounts }
  });

  res.json({
    message: 'Clase eliminada de forma definitiva',
    cascade: cascadeCounts
  });
});
