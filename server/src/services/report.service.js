import { EVALUATION_STATUSES } from '../constants/evaluation.constants.js';
import { USER_ROLES } from '../constants/user.constants.js';
import { Class as AcademicClass } from '../models/Class.js';
import { Evaluation } from '../models/Evaluation.js';
import { Group } from '../models/Group.js';
import { Instrument } from '../models/Instrument.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { calculateFinalGrade } from '../utils/calculateGrades.js';

const evaluationPopulate = [
  { path: 'student', select: 'name email status' },
  { path: 'evaluator', select: 'name email role' },
  {
    path: 'task',
    select: 'title weight dueDate status group class',
    populate: {
      path: 'class',
      select: 'name status order module course',
      populate: [
        { path: 'module', select: 'name status order course' },
        { path: 'course', select: 'name status' }
      ]
    }
  },
  { path: 'instrument', select: 'title type status maxScore' }
];

function evaluatorScope(req) {
  if (req.user.role === USER_ROLES.ADMIN) return {};
  return { evaluator: req.user._id };
}

function publishedFilter(req) {
  return {
    status: EVALUATION_STATUSES.PUBLISHED,
    ...evaluatorScope(req)
  };
}

function hierarchyQuery(req) {
  return req.validated?.query ?? {};
}

function hasHierarchyQuery(req) {
  const { courseId, moduleId, classId } = hierarchyQuery(req);
  return Boolean(courseId || moduleId || classId);
}

async function buildHierarchyTaskFilter(req) {
  if (!hasHierarchyQuery(req)) return {};

  const { courseId, moduleId, classId } = hierarchyQuery(req);
  const classFilter = {
    ...evaluatorScope(req)
  };

  if (courseId) classFilter.course = courseId;
  if (moduleId) classFilter.module = moduleId;
  if (classId) classFilter._id = classId;

  const classIds = await AcademicClass.find(classFilter).distinct('_id');
  if (!classIds.length) return { task: { $in: [] } };

  const taskIds = await Task.find({
    ...evaluatorScope(req),
    class: { $in: classIds }
  }).distinct('_id');

  return { task: { $in: taskIds } };
}

async function findGroupForReport(req, groupId) {
  const group = await Group.findOne({
    _id: groupId,
    ...evaluatorScope(req)
  }).populate('students', 'name email status');

  if (!group) throw new AppError('Grupo no encontrado', 404);
  return group;
}

async function findTaskForReport(req, taskId) {
  const task = await Task.findOne({
    _id: taskId,
    ...evaluatorScope(req)
  })
    .populate('group', 'name status')
    .populate('students', 'name email status')
    .populate('instrument', 'title type status maxScore');

  if (!task) throw new AppError('Tarea no encontrada', 404);
  return task;
}

function summarizeEvaluations(evaluations) {
  const count = evaluations.length;
  const average = count
    ? Math.round((evaluations.reduce((sum, evaluation) => sum + Number(evaluation.percentage || 0), 0) / count) * 100) / 100
    : 0;
  const highest = count ? Math.max(...evaluations.map((evaluation) => Number(evaluation.percentage || 0))) : 0;
  const lowest = count ? Math.min(...evaluations.map((evaluation) => Number(evaluation.percentage || 0))) : 0;

  return { count, average, highest, lowest };
}

function serializeEvaluation(evaluation) {
  return {
    id: evaluation._id,
    student: evaluation.student,
    evaluator: evaluation.evaluator,
    task: evaluation.task,
    instrument: evaluation.instrument,
    score: evaluation.score,
    maxScore: evaluation.maxScore,
    percentage: evaluation.percentage,
    feedback: evaluation.feedback,
    suggestions: evaluation.suggestions,
    studentReportEnabled: evaluation.studentReportEnabled,
    evaluatedAt: evaluation.evaluatedAt,
    publishedAt: evaluation.publishedAt
  };
}

export async function buildStudentReport(req, studentId) {
  if (req.user.role === USER_ROLES.STUDENT && String(req.user._id) !== studentId) {
    throw new AppError('No tienes permiso para ver este reporte', 403);
  }

  const evaluationFilter = {
    status: EVALUATION_STATUSES.PUBLISHED,
    student: studentId
  };
  const studentFilter = {
    _id: studentId,
    role: USER_ROLES.STUDENT
  };

  if (req.user.role === USER_ROLES.EVALUATOR) {
    evaluationFilter.evaluator = req.user._id;
    const evaluatorGroupIds = await Group.find({ evaluator: req.user._id }).distinct('_id');
    studentFilter.groups = { $in: evaluatorGroupIds };
  }

  if (req.user.role === USER_ROLES.STUDENT) {
    evaluationFilter.studentReportEnabled = true;
  }

  const hierarchyFilter = await buildHierarchyTaskFilter(req);

  const [student, evaluations] = await Promise.all([
    User.findOne(studentFilter).populate('groups', 'name status evaluator'),
    Evaluation.find({ ...evaluationFilter, ...hierarchyFilter })
      .populate(evaluationPopulate)
      .sort({ publishedAt: -1, evaluatedAt: -1 })
  ]);

  if (!student) throw new AppError('Estudiante no encontrado', 404);
  if (req.user.role === USER_ROLES.STUDENT && !evaluations.length) {
    throw new AppError('El reporte imprimible aún no está habilitado por el evaluador', 403);
  }

  return {
    type: 'student',
    student,
    permissions: {
      studentPrintEnabled: evaluations.some((evaluation) => evaluation.studentReportEnabled)
    },
    summary: {
      ...summarizeEvaluations(evaluations),
      finalGrade: calculateFinalGrade(evaluations)
    },
    evaluations: evaluations.map(serializeEvaluation),
    filters: hierarchyQuery(req),
    generatedAt: new Date().toISOString()
  };
}

export async function buildGroupReport(req, groupId) {
  const group = await findGroupForReport(req, groupId);
  const studentIds = group.students.map((student) => student._id);
  const hierarchyFilter = await buildHierarchyTaskFilter(req);
  const evaluations = await Evaluation.find({
    ...publishedFilter(req),
    student: { $in: studentIds },
    ...hierarchyFilter
  })
    .populate(evaluationPopulate)
    .sort({ publishedAt: -1, evaluatedAt: -1 });

  const students = group.students.map((student) => {
    const studentEvaluations = evaluations.filter((evaluation) => evaluation.student._id.equals(student._id));
    return {
      student,
      summary: {
        ...summarizeEvaluations(studentEvaluations),
        finalGrade: calculateFinalGrade(studentEvaluations)
      }
    };
  });

  return {
    type: 'group',
    group,
    summary: summarizeEvaluations(evaluations),
    students,
    evaluations: evaluations.map(serializeEvaluation),
    filters: hierarchyQuery(req),
    generatedAt: new Date().toISOString()
  };
}

export async function buildTaskReport(req, taskId) {
  const task = await findTaskForReport(req, taskId);
  const evaluations = await Evaluation.find({
    ...publishedFilter(req),
    task: task._id
  })
    .populate(evaluationPopulate)
    .sort({ percentage: -1, publishedAt: -1 });

  return {
    type: 'task',
    task,
    summary: summarizeEvaluations(evaluations),
    evaluations: evaluations.map(serializeEvaluation),
    generatedAt: new Date().toISOString()
  };
}

export async function buildFinalGradesReport(req, groupId) {
  const group = await findGroupForReport(req, groupId);
  const studentIds = group.students.map((student) => student._id);
  const hierarchyFilter = await buildHierarchyTaskFilter(req);
  const evaluations = await Evaluation.find({
    ...publishedFilter(req),
    student: { $in: studentIds },
    ...hierarchyFilter
  }).populate({ path: 'task', select: 'title weight dueDate' });

  const grades = group.students.map((student) => {
    const studentEvaluations = evaluations.filter((evaluation) => evaluation.student.equals(student._id));
    return {
      student,
      finalGrade: calculateFinalGrade(studentEvaluations)
    };
  });

  return {
    type: 'final_grades',
    group,
    grades,
    filters: hierarchyQuery(req),
    generatedAt: new Date().toISOString()
  };
}

export async function buildInstrumentReport(req, instrumentId) {
  const instrument = await Instrument.findOne({
    _id: instrumentId,
    ...evaluatorScope(req)
  }).populate('evaluator', 'name email role');

  if (!instrument) throw new AppError('Instrumento no encontrado', 404);

  const evaluations = await Evaluation.find({
    ...publishedFilter(req),
    instrument: instrument._id,
    ...(await buildHierarchyTaskFilter(req))
  })
    .populate(evaluationPopulate)
    .sort({ publishedAt: -1, evaluatedAt: -1 });

  return {
    type: 'instrument',
    instrument,
    summary: summarizeEvaluations(evaluations),
    evaluations: evaluations.map(serializeEvaluation),
    filters: hierarchyQuery(req),
    generatedAt: new Date().toISOString()
  };
}
