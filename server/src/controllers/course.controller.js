import { ACADEMIC_STATUSES } from '../constants/academicHierarchy.constants.js';
import { USER_ROLES } from '../constants/user.constants.js';
import { Class as AcademicClass } from '../models/Class.js';
import { Course } from '../models/Course.js';
import { Module as AcademicModule } from '../models/Module.js';
import { Task } from '../models/Task.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { bulkArchive } from '../utils/cascadeArchive.js';
import { writeAudit } from '../utils/audit.js';

function courseScope(req) {
  if (req.user.role === USER_ROLES.ADMIN) {
    const { evaluatorId } = req.validated.query ?? {};
    return evaluatorId ? { evaluator: evaluatorId } : {};
  }

  return { evaluator: req.user._id };
}

async function findCourseForEvaluator(req, id) {
  const filter = { _id: id };
  if (req.user.role !== USER_ROLES.ADMIN) filter.evaluator = req.user._id;

  const course = await Course.findOne(filter).populate('evaluator', 'name email role');

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
    [classesArchived, modulesArchived] = await Promise.all([
      bulkArchive(AcademicClass, { module: { $in: activeModuleIds }, evaluator: req.user._id }),
      bulkArchive(AcademicModule, { _id: { $in: activeModuleIds } })
    ]);
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
      ...(req.user.role !== USER_ROLES.ADMIN ? { evaluator: req.user._id } : {})
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

export const deleteCoursePermanent = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.validated.params.id).populate('evaluator', 'name email role');
  if (!course) {
    throw new AppError('Curso no encontrado', 404);
  }

  const cascade = req.validated.query?.cascade;
  const moduleIds = await AcademicModule.find({ course: course._id }).distinct('_id');
  const classIds = await AcademicClass.find({ course: course._id }).distinct('_id');
  const taskCount = await Task.countDocuments({ class: { $in: classIds } });

  if ((moduleIds.length > 0 || classIds.length > 0 || taskCount > 0) && !cascade) {
    throw new AppError(
      'Este curso tiene módulos, clases o tareas asociadas. Confirma la eliminación en cascada.',
      409
    );
  }

  const [tasksDeleted, classesDeleted, modulesDeleted] = await Promise.all([
    Task.deleteMany({ class: { $in: classIds } }),
    AcademicClass.deleteMany({ course: course._id }),
    AcademicModule.deleteMany({ course: course._id })
  ]);

  await Course.deleteOne({ _id: course._id });

  const cascadeCounts = {
    modules: modulesDeleted.deletedCount ?? 0,
    classes: classesDeleted.deletedCount ?? 0,
    tasks: tasksDeleted.deletedCount ?? 0
  };

  await writeAudit({
    actor: req.user._id,
    action: 'course.permanentDelete',
    entity: 'Course',
    entityId: course._id,
    before: course.toObject(),
    after: null,
    metadata: { cascade: cascadeCounts }
  });

  res.json({
    message: 'Curso eliminado de forma definitiva',
    cascade: cascadeCounts
  });
});
