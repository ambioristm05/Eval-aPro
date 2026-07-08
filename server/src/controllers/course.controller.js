import { ACADEMIC_STATUSES } from '../constants/academicHierarchy.constants.js';
import { Class as AcademicClass } from '../models/Class.js';
import { Course } from '../models/Course.js';
import { Module as AcademicModule } from '../models/Module.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function courseScope(req) {
  return { evaluator: req.user._id };
}

async function findCourseForEvaluator(req, id) {
  const course = await Course.findOne({
    _id: id,
    ...courseScope(req)
  }).populate('evaluator', 'name email role');

  if (!course) {
    throw new AppError('Curso no encontrado', 404);
  }

  return course;
}

function applySearch(filter, search) {
  if (search) filter.name = { $regex: search, $options: 'i' };
  return filter;
}

export const createCourse = asyncHandler(async (req, res) => {
  const { name, description, status } = req.validated.body;

  const course = await Course.create({
    name,
    description,
    status,
    evaluator: req.user._id
  });

  res.status(201).json({ course });
});

export const getCourses = asyncHandler(async (req, res) => {
  const { search, status, page, limit } = req.validated.query;
  const filter = applySearch({ ...courseScope(req) }, search);

  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate('evaluator', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Course.countDocuments(filter)
  ]);

  res.json({
    courses,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const getCourseById = asyncHandler(async (req, res) => {
  const course = await findCourseForEvaluator(req, req.validated.params.id);

  res.json({ course });
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = await findCourseForEvaluator(req, req.validated.params.id);
  const { name, description, status } = req.validated.body;

  if (name !== undefined) course.name = name;
  if (description !== undefined) course.description = description;
  if (status !== undefined) course.status = status;

  await course.save();

  res.json({ course });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await findCourseForEvaluator(req, req.validated.params.id);
  const cascade = req.validated.query?.cascade;
  const activeModuleIds = await AcademicModule.find({
    course: course._id,
    evaluator: req.user._id,
    status: ACADEMIC_STATUSES.ACTIVE
  }).distinct('_id');

  if (activeModuleIds.length > 0 && !cascade) {
    throw new AppError('No puedes archivar un curso con módulos activos', 409);
  }

  let modulesArchived = 0;
  let classesArchived = 0;

  if (activeModuleIds.length > 0 && cascade) {
    const [classResult, moduleResult] = await Promise.all([
      AcademicClass.updateMany(
        { module: { $in: activeModuleIds }, evaluator: req.user._id, status: ACADEMIC_STATUSES.ACTIVE },
        { $set: { status: ACADEMIC_STATUSES.ARCHIVED } }
      ),
      AcademicModule.updateMany({ _id: { $in: activeModuleIds } }, { $set: { status: ACADEMIC_STATUSES.ARCHIVED } })
    ]);
    classesArchived = classResult.modifiedCount ?? 0;
    modulesArchived = moduleResult.modifiedCount ?? 0;
  }

  course.status = ACADEMIC_STATUSES.ARCHIVED;
  await course.save();

  res.json({
    message: 'Curso archivado correctamente',
    course,
    cascade: { modulesArchived, classesArchived }
  });
});

export const getCourseModules = asyncHandler(async (req, res) => {
  const course = await findCourseForEvaluator(req, req.validated.params.courseId);
  const { search, status, page, limit } = req.validated.query;
  const filter = applySearch(
    {
      course: course._id,
      evaluator: req.user._id
    },
    search
  );

  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [modules, total] = await Promise.all([
    AcademicModule.find(filter).sort({ order: 1, createdAt: 1 }).skip(skip).limit(limit),
    AcademicModule.countDocuments(filter)
  ]);

  res.json({
    modules,
    course,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const createModuleForCourse = asyncHandler(async (req, res) => {
  const course = await findCourseForEvaluator(req, req.validated.params.courseId);
  const { name, description, status, order } = req.validated.body;

  const module = await AcademicModule.create({
    name,
    description,
    status,
    order,
    course: course._id,
    evaluator: req.user._id
  });

  res.status(201).json({ module, course });
});
