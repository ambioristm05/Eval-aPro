import { ACADEMIC_STATUSES } from '../constants/academicHierarchy.constants.js';
import { TASK_STATUSES } from '../constants/task.constants.js';
import { USER_ROLES, USER_STATUSES } from '../constants/user.constants.js';
import { ensureInstrumentForEvaluator } from './instrument.controller.js';
import { Class as AcademicClass } from '../models/Class.js';
import { Group } from '../models/Group.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const taskPopulate = [
  { path: 'evaluator', select: 'name email role' },
  {
    path: 'class',
    select: 'name description status order module course evaluator',
    populate: [
      { path: 'course', select: 'name status' },
      { path: 'module', select: 'name status' }
    ]
  },
  { path: 'group', select: 'name status evaluator' },
  { path: 'students', select: 'name email role status' },
  { path: 'instrument', select: 'title type status maxScore criteria indicators options' }
];

function taskScope(req) {
  if (req.user.role === USER_ROLES.ADMIN) return {};
  if (req.user.role === USER_ROLES.EVALUATOR) return { evaluator: req.user._id };
  return {
    $or: [{ students: req.user._id }, { group: { $in: req.user.groups || [] } }]
  };
}

async function findTaskForUser(req, id) {
  const task = await Task.findOne({
    _id: id,
    ...taskScope(req)
  }).populate(taskPopulate);

  if (!task) {
    throw new AppError('Tarea no encontrada', 404);
  }

  return task;
}

async function findClassForEvaluator(req, classId) {
  const academicClass = await AcademicClass.findOne({
    _id: classId,
    evaluator: req.user._id
  })
    .populate('course', 'status')
    .populate('module', 'status');

  if (!academicClass) {
    throw new AppError('Clase no encontrada', 404);
  }

  return academicClass;
}

function isHierarchyArchived(academicClass) {
  return (
    academicClass?.status === ACADEMIC_STATUSES.ARCHIVED ||
    academicClass?.module?.status === ACADEMIC_STATUSES.ARCHIVED ||
    academicClass?.course?.status === ACADEMIC_STATUSES.ARCHIVED
  );
}

function ensureClassIsEditable(academicClass) {
  if (isHierarchyArchived(academicClass)) {
    throw new AppError('No puedes crear ni editar tareas en un curso, módulo o clase archivado', 409);
  }
}

function ensureValidTaskDates(task) {
  if (!task.startDate || !task.dueDate) return;

  if (task.dueDate < task.startDate) {
    throw new AppError('La fecha de entrega debe ser posterior o igual a la fecha de inicio', 400);
  }
}

async function resolveTaskRelations(req, { groupId, studentIds = [] }) {
  let group = null;
  const uniqueStudentIds = [...new Set(studentIds.map(String))];

  if (groupId) {
    const groupFilter = {
      _id: groupId
    };

    if (req.user.role === USER_ROLES.EVALUATOR) {
      groupFilter.evaluator = req.user._id;
    }

    group = await Group.findOne(groupFilter);
    if (!group) {
      throw new AppError('Grupo no encontrado', 404);
    }
  }

  if (!uniqueStudentIds.length) {
    return {
      group,
      students: []
    };
  }

  const studentFilter = {
    _id: { $in: uniqueStudentIds },
    role: USER_ROLES.STUDENT,
    status: USER_STATUSES.ACTIVE
  };

  if (req.user.role === USER_ROLES.EVALUATOR) {
    if (group) {
      studentFilter.groups = group._id;
    } else {
      const evaluatorGroupIds = await Group.find({ evaluator: req.user._id }).distinct('_id');
      studentFilter.groups = { $in: evaluatorGroupIds };
    }
  }

  const students = await User.find(studentFilter).select('_id');
  if (students.length !== uniqueStudentIds.length) {
    throw new AppError('Uno o más estudiantes no son válidos para esta tarea', 400);
  }

  return {
    group,
    students
  };
}

export const createTask = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    status,
    group: groupId,
    students: studentIds,
    instrument,
    startDate,
    dueDate,
    weight,
    class: classId
  } = req.validated.body;
  const academicClass = await findClassForEvaluator(req, classId);
  ensureClassIsEditable(academicClass);
  const relations = await resolveTaskRelations(req, { groupId, studentIds });
  const resolvedInstrument = await ensureInstrumentForEvaluator({
    instrumentId: instrument,
    evaluatorId: req.user._id
  });

  const task = await Task.create({
    title,
    description,
    status,
    evaluator: req.user._id,
    class: academicClass._id,
    group: relations.group?._id,
    students: relations.students.map((student) => student._id),
    instrument: resolvedInstrument?._id,
    startDate,
    dueDate,
    weight
  });

  const populatedTask = await Task.findById(task._id).populate(taskPopulate);

  res.status(201).json({ task: populatedTask });
});

export const createTaskForClass = asyncHandler(async (req, res) => {
  const academicClass = await findClassForEvaluator(req, req.validated.params.classId);
  ensureClassIsEditable(academicClass);
  const { title, description, status, group: groupId, students: studentIds, instrument, startDate, dueDate, weight } = req.validated.body;
  const relations = await resolveTaskRelations(req, { groupId, studentIds });
  const resolvedInstrument = await ensureInstrumentForEvaluator({
    instrumentId: instrument,
    evaluatorId: req.user._id
  });

  const task = await Task.create({
    title,
    description,
    status,
    evaluator: req.user._id,
    class: academicClass._id,
    group: relations.group?._id,
    students: relations.students.map((student) => student._id),
    instrument: resolvedInstrument?._id,
    startDate,
    dueDate,
    weight
  });

  const populatedTask = await Task.findById(task._id).populate(taskPopulate);

  res.status(201).json({ task: populatedTask, class: academicClass });
});

export const getTasks = asyncHandler(async (req, res) => {
  const { search, status, groupId, studentId, courseId, moduleId, classId, page, limit } = req.validated.query;
  const filter = {
    ...taskScope(req)
  };

  if (status) filter.status = status;
  if (groupId) filter.group = groupId;
  if (studentId && req.user.role !== USER_ROLES.STUDENT) filter.students = studentId;
  if (search) filter.title = { $regex: search, $options: 'i' };

  if (classId) {
    filter.class = classId;
  } else if (moduleId || courseId) {
    const classFilter = { evaluator: req.user._id };
    if (moduleId) classFilter.module = moduleId;
    if (courseId) classFilter.course = courseId;
    const classIds = await AcademicClass.find(classFilter).distinct('_id');
    filter.class = { $in: classIds };
  }

  const skip = (page - 1) * limit;
  const [tasks, total] = await Promise.all([
    Task.find(filter).populate(taskPopulate).sort({ dueDate: 1, createdAt: -1 }).skip(skip).limit(limit),
    Task.countDocuments(filter)
  ]);

  res.json({
    tasks,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const getClassTasks = asyncHandler(async (req, res) => {
  const academicClass = await findClassForEvaluator(req, req.validated.params.classId);
  const { search, status, groupId, studentId, page, limit } = req.validated.query;
  const filter = {
    evaluator: req.user._id,
    class: academicClass._id
  };

  if (status) filter.status = status;
  if (groupId) filter.group = groupId;
  if (studentId) filter.students = studentId;
  if (search) filter.title = { $regex: search, $options: 'i' };

  const skip = (page - 1) * limit;
  const [tasks, total] = await Promise.all([
    Task.find(filter).populate(taskPopulate).sort({ dueDate: 1, createdAt: -1 }).skip(skip).limit(limit),
    Task.countDocuments(filter)
  ]);

  res.json({
    tasks,
    class: academicClass,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const getTaskById = asyncHandler(async (req, res) => {
  const task = await findTaskForUser(req, req.validated.params.id);

  res.json({ task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await findTaskForUser(req, req.validated.params.id);

  if (isHierarchyArchived(task.class)) {
    throw new AppError('No puedes editar una tarea de un curso, módulo o clase archivado', 409);
  }

  const { title, description, status, group: groupId, students: studentIds, instrument, startDate, dueDate, weight } = req.validated.body;

  if (groupId !== undefined || studentIds !== undefined) {
    const relations = await resolveTaskRelations(req, {
      groupId: groupId ?? task.group?._id,
      studentIds: studentIds ?? task.students.map((student) => student._id)
    });

    task.group = relations.group?._id;
    task.students = relations.students.map((student) => student._id);
  }

  if (instrument !== undefined) {
    const resolvedInstrument = await ensureInstrumentForEvaluator({
      instrumentId: instrument,
      evaluatorId: task.evaluator._id || task.evaluator
    });
    task.instrument = resolvedInstrument?._id;
  }

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (startDate !== undefined) task.startDate = startDate;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (weight !== undefined) task.weight = weight;

  ensureValidTaskDates(task);

  await task.save();

  const populatedTask = await Task.findById(task._id).populate(taskPopulate);
  res.json({ task: populatedTask });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await findTaskForUser(req, req.validated.params.id);

  if (isHierarchyArchived(task.class)) {
    throw new AppError('No puedes eliminar una tarea de un curso, módulo o clase archivado', 409);
  }

  await Task.deleteOne({ _id: task._id });

  res.json({
    message: 'Tarea eliminada correctamente'
  });
});
