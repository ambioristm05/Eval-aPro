import { EVALUATION_STATUSES } from '../constants/evaluation.constants.js';
import { USER_ROLES } from '../constants/user.constants.js';
import { Evaluation } from '../models/Evaluation.js';
import { Group } from '../models/Group.js';
import { Instrument } from '../models/Instrument.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { calculateFinalGrade } from '../utils/calculateGrades.js';

const evaluationPopulate = [
  { path: 'student', select: 'name email status' },
  { path: 'evaluator', select: 'name email role' },
  { path: 'task', select: 'title weight dueDate status group' },
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
    evaluatedAt: evaluation.evaluatedAt,
    publishedAt: evaluation.publishedAt
  };
}

export const getStudentReport = asyncHandler(async (req, res) => {
  const { studentId } = req.validated.params;

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

  const [student, evaluations] = await Promise.all([
    User.findOne(studentFilter).populate('groups', 'name status evaluator'),
    Evaluation.find(evaluationFilter).populate(evaluationPopulate).sort({ publishedAt: -1, evaluatedAt: -1 })
  ]);

  if (!student) throw new AppError('Estudiante no encontrado', 404);

  res.json({
    report: {
      type: 'student',
      student,
      summary: {
        ...summarizeEvaluations(evaluations),
        finalGrade: calculateFinalGrade(evaluations)
      },
      evaluations: evaluations.map(serializeEvaluation),
      generatedAt: new Date().toISOString()
    }
  });
});

export const getGroupReport = asyncHandler(async (req, res) => {
  const group = await findGroupForReport(req, req.validated.params.groupId);
  const studentIds = group.students.map((student) => student._id);
  const evaluations = await Evaluation.find({
    ...publishedFilter(req),
    student: { $in: studentIds }
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

  res.json({
    report: {
      type: 'group',
      group,
      summary: summarizeEvaluations(evaluations),
      students,
      evaluations: evaluations.map(serializeEvaluation),
      generatedAt: new Date().toISOString()
    }
  });
});

export const getTaskReport = asyncHandler(async (req, res) => {
  const task = await findTaskForReport(req, req.validated.params.taskId);
  const evaluations = await Evaluation.find({
    ...publishedFilter(req),
    task: task._id
  })
    .populate(evaluationPopulate)
    .sort({ percentage: -1, publishedAt: -1 });

  res.json({
    report: {
      type: 'task',
      task,
      summary: summarizeEvaluations(evaluations),
      evaluations: evaluations.map(serializeEvaluation),
      generatedAt: new Date().toISOString()
    }
  });
});

export const getFinalGradesReport = asyncHandler(async (req, res) => {
  const group = await findGroupForReport(req, req.validated.params.groupId);
  const studentIds = group.students.map((student) => student._id);
  const evaluations = await Evaluation.find({
    ...publishedFilter(req),
    student: { $in: studentIds }
  }).populate({ path: 'task', select: 'title weight dueDate' });

  const grades = group.students.map((student) => {
    const studentEvaluations = evaluations.filter((evaluation) => evaluation.student.equals(student._id));
    return {
      student,
      finalGrade: calculateFinalGrade(studentEvaluations)
    };
  });

  res.json({
    report: {
      type: 'final_grades',
      group,
      grades,
      generatedAt: new Date().toISOString()
    }
  });
});

export const getInstrumentReport = asyncHandler(async (req, res) => {
  const instrument = await Instrument.findOne({
    _id: req.validated.params.instrumentId,
    ...evaluatorScope(req)
  }).populate('evaluator', 'name email role');

  if (!instrument) throw new AppError('Instrumento no encontrado', 404);

  const evaluations = await Evaluation.find({
    ...publishedFilter(req),
    instrument: instrument._id
  })
    .populate(evaluationPopulate)
    .sort({ publishedAt: -1, evaluatedAt: -1 });

  res.json({
    report: {
      type: 'instrument',
      instrument,
      summary: summarizeEvaluations(evaluations),
      evaluations: evaluations.map(serializeEvaluation),
      generatedAt: new Date().toISOString()
    }
  });
});
