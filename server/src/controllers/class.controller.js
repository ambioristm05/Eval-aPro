import { ACADEMIC_STATUSES } from '../constants/academicHierarchy.constants.js';
import { Class as AcademicClass } from '../models/Class.js';
import { Task } from '../models/Task.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

async function findClassForEvaluator(req, id) {
  const academicClass = await AcademicClass.findOne({
    _id: id,
    evaluator: req.user._id
  })
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
    cascade: { tasksLinked: linkedTasks }
  });
});
