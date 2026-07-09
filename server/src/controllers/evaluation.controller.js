import { EVALUATION_STATUSES } from '../constants/evaluation.constants.js';
import { INSTRUMENT_STATUSES } from '../constants/instrument.constants.js';
import { USER_ROLES, USER_STATUSES } from '../constants/user.constants.js';
import { Evaluation } from '../models/Evaluation.js';
import { Group } from '../models/Group.js';
import { Instrument } from '../models/Instrument.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAudit } from '../utils/audit.js';
import { calculatePercentage } from '../utils/calculateGrades.js';

const evaluationPopulate = [
  { path: 'student', select: 'name email role status' },
  { path: 'evaluator', select: 'name email role' },
  { path: 'task', select: 'title status weight dueDate groups students' },
  { path: 'instrument', select: 'title type status maxScore criteria indicators options' }
];

function evaluationScope(req) {
  if (req.user.role === USER_ROLES.ADMIN) return {};
  if (req.user.role === USER_ROLES.EVALUATOR) return { evaluator: req.user._id };
  return {
    student: req.user._id,
    status: EVALUATION_STATUSES.PUBLISHED
  };
}

function calculateScoreFromAnswers(answers = [], instrument) {
  const rawScore = answers.reduce((sum, answer) => sum + Number(answer.score || 0), 0);
  const maxScore = Number(instrument.maxScore || 0);
  const score = maxScore ? Math.min(rawScore, maxScore) : rawScore;

  return {
    score,
    maxScore,
    percentage: calculatePercentage(score, maxScore)
  };
}

function idOf(value) {
  return value?._id || value;
}

function evaluationAuditSnapshot(evaluation) {
  return {
    id: evaluation._id,
    student: idOf(evaluation.student),
    evaluator: idOf(evaluation.evaluator),
    task: idOf(evaluation.task),
    instrument: idOf(evaluation.instrument),
    status: evaluation.status,
    score: evaluation.score,
    maxScore: evaluation.maxScore,
    percentage: evaluation.percentage,
    evaluatedAt: evaluation.evaluatedAt,
    publishedAt: evaluation.publishedAt,
    studentReportEnabled: evaluation.studentReportEnabled
  };
}

async function findEvaluationForUser(req, id) {
  const evaluation = await Evaluation.findOne({
    _id: id,
    ...evaluationScope(req)
  }).populate(evaluationPopulate);

  if (!evaluation) {
    throw new AppError('Evaluación no encontrada', 404);
  }

  return evaluation;
}

async function ensureTaskAndStudentForEvaluator({ evaluatorId, taskId, studentId }) {
  const task = await Task.findOne({
    _id: taskId,
    evaluator: evaluatorId
  });

  if (!task) {
    throw new AppError('Tarea no encontrada', 404);
  }

  if (!task.instrument) {
    throw new AppError('La tarea no tiene instrumento asociado', 400);
  }

  const student = await User.findOne({
    _id: studentId,
    role: USER_ROLES.STUDENT,
    status: { $ne: USER_STATUSES.DELETED }
  });

  if (!student) {
    throw new AppError('Estudiante no encontrado', 404);
  }

  const assignedDirectly = task.students.some((id) => id.equals(student._id));
  const assignedByGroup =
    task.groups.length && (await Group.exists({ _id: { $in: task.groups }, students: student._id }));

  if (!assignedDirectly && !assignedByGroup) {
    throw new AppError('El estudiante no está asignado a esta tarea', 400);
  }

  const instrument = await Instrument.findOne({
    _id: task.instrument,
    evaluator: evaluatorId,
    status: { $ne: INSTRUMENT_STATUSES.ARCHIVED }
  });

  if (!instrument) {
    throw new AppError('Instrumento no encontrado para esta tarea', 404);
  }

  return { task, student, instrument };
}

export const createEvaluation = asyncHandler(async (req, res) => {
  const { student: studentId, task: taskId, answers, feedback, suggestions, status } = req.validated.body;
  const { task, student, instrument } = await ensureTaskAndStudentForEvaluator({
    evaluatorId: req.user._id,
    taskId,
    studentId
  });
  const existingEvaluation = await Evaluation.exists({
    evaluator: req.user._id,
    student: student._id,
    task: task._id
  });

  if (existingEvaluation) {
    throw new AppError('Ya existe una evaluación para este estudiante en esta tarea', 409);
  }

  const grades = calculateScoreFromAnswers(answers, instrument);
  const evaluatedAt = status === EVALUATION_STATUSES.DRAFT ? undefined : new Date();

  const evaluation = await Evaluation.create({
    student: student._id,
    evaluator: req.user._id,
    task: task._id,
    instrument: instrument._id,
    answers,
    ...grades,
    feedback,
    suggestions,
    status,
    evaluatedAt
  });

  const populatedEvaluation = await Evaluation.findById(evaluation._id).populate(evaluationPopulate);
  res.status(201).json({ evaluation: populatedEvaluation });
});

export const getEvaluations = asyncHandler(async (req, res) => {
  const { studentId, taskId, status, page, limit } = req.validated.query;
  const filter = {
    ...evaluationScope(req)
  };

  if (studentId && req.user.role !== USER_ROLES.STUDENT) filter.student = studentId;
  if (taskId) filter.task = taskId;
  if (status && req.user.role !== USER_ROLES.STUDENT) filter.status = status;

  const skip = (page - 1) * limit;
  const [evaluations, total] = await Promise.all([
    Evaluation.find(filter).populate(evaluationPopulate).sort({ evaluatedAt: -1, createdAt: -1 }).skip(skip).limit(limit),
    Evaluation.countDocuments(filter)
  ]);

  res.json({
    evaluations,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const getEvaluationById = asyncHandler(async (req, res) => {
  const evaluation = await findEvaluationForUser(req, req.validated.params.id);

  res.json({ evaluation });
});

export const getEvaluationsByStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.validated.params;
  const { page, limit, status } = req.validated.query;
  const filter = {
    student: studentId,
    ...evaluationScope(req)
  };

  if (req.user.role === USER_ROLES.STUDENT && String(req.user._id) !== studentId) {
    throw new AppError('No tienes permiso para ver estas evaluaciones', 403);
  }

  if (status && req.user.role !== USER_ROLES.STUDENT) filter.status = status;

  const skip = (page - 1) * limit;
  const [evaluations, total] = await Promise.all([
    Evaluation.find(filter).populate(evaluationPopulate).sort({ evaluatedAt: -1, createdAt: -1 }).skip(skip).limit(limit),
    Evaluation.countDocuments(filter)
  ]);

  res.json({
    evaluations,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const updateEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await findEvaluationForUser(req, req.validated.params.id);
  const { answers, feedback, suggestions, status } = req.validated.body;
  const instrument = await Instrument.findById(evaluation.instrument._id || evaluation.instrument);
  const before = evaluationAuditSnapshot(evaluation);

  if (!instrument) {
    throw new AppError('Instrumento no encontrado para recalcular la evaluación', 404);
  }

  if (answers !== undefined) {
    evaluation.answers = answers;
    const grades = calculateScoreFromAnswers(answers, instrument);
    evaluation.score = grades.score;
    evaluation.maxScore = grades.maxScore;
    evaluation.percentage = grades.percentage;
  }

  if (feedback !== undefined) evaluation.feedback = feedback;
  if (suggestions !== undefined) evaluation.suggestions = suggestions;
  if (status !== undefined) {
    evaluation.status = status;
    if (status !== EVALUATION_STATUSES.DRAFT && !evaluation.evaluatedAt) {
      evaluation.evaluatedAt = new Date();
    }
    if (status === EVALUATION_STATUSES.PUBLISHED && !evaluation.publishedAt) {
      evaluation.publishedAt = new Date();
    }
  }

  await evaluation.save();
  await writeAudit({
    actor: req.user._id,
    action:
      status === EVALUATION_STATUSES.PUBLISHED && before.status !== EVALUATION_STATUSES.PUBLISHED
        ? 'evaluation.publish'
        : 'evaluation.update',
    entity: 'Evaluation',
    entityId: evaluation._id,
    before,
    after: evaluationAuditSnapshot(evaluation),
    metadata: {
      changedFields: Object.keys(req.validated.body)
    }
  });

  const populatedEvaluation = await Evaluation.findById(evaluation._id).populate(evaluationPopulate);
  res.json({ evaluation: populatedEvaluation });
});

export const deleteEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await findEvaluationForUser(req, req.validated.params.id);
  const before = evaluationAuditSnapshot(evaluation);

  if (evaluation.status === EVALUATION_STATUSES.PUBLISHED) {
    throw new AppError('No puedes eliminar una evaluación publicada', 409);
  }

  await Evaluation.deleteOne({ _id: evaluation._id });
  await writeAudit({
    actor: req.user._id,
    action: 'evaluation.delete',
    entity: 'Evaluation',
    entityId: evaluation._id,
    before,
    after: null
  });

  res.json({
    message: 'Evaluación eliminada correctamente'
  });
});

export const publishEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await findEvaluationForUser(req, req.validated.params.id);
  const before = evaluationAuditSnapshot(evaluation);

  evaluation.status = EVALUATION_STATUSES.PUBLISHED;
  evaluation.evaluatedAt = evaluation.evaluatedAt || new Date();
  evaluation.publishedAt = new Date();

  await evaluation.save();
  await writeAudit({
    actor: req.user._id,
    action: 'evaluation.publish',
    entity: 'Evaluation',
    entityId: evaluation._id,
    before,
    after: evaluationAuditSnapshot(evaluation)
  });

  const populatedEvaluation = await Evaluation.findById(evaluation._id).populate(evaluationPopulate);
  res.json({ evaluation: populatedEvaluation });
});
