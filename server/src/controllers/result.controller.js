import { EVALUATION_STATUSES } from '../constants/evaluation.constants.js';
import { USER_ROLES } from '../constants/user.constants.js';
import { Evaluation } from '../models/Evaluation.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { calculateFinalGrade } from '../utils/calculateGrades.js';

const resultPopulate = [
  { path: 'student', select: 'name email role status' },
  { path: 'evaluator', select: 'name email role' },
  { path: 'task', select: 'title description status weight dueDate group' },
  { path: 'instrument', select: 'title description type maxScore criteria indicators' }
];

function resultScope(req) {
  const baseScope = {
    status: EVALUATION_STATUSES.PUBLISHED
  };

  if (req.user.role === USER_ROLES.ADMIN) return baseScope;
  if (req.user.role === USER_ROLES.EVALUATOR) {
    return {
      ...baseScope,
      evaluator: req.user._id
    };
  }

  return {
    ...baseScope,
    student: req.user._id
  };
}

function buildResult(evaluation) {
  const instrument = evaluation.instrument;
  const criteriaById = new Map((instrument?.criteria || []).map((criterion) => [String(criterion._id), criterion]));
  const indicatorsById = new Map((instrument?.indicators || []).map((indicator) => [String(indicator._id), indicator]));

  const answers = evaluation.answers.map((answer) => {
    const criterion = answer.criterion ? criteriaById.get(String(answer.criterion)) : null;
    const indicator = answer.indicator ? indicatorsById.get(String(answer.indicator)) : null;
    const maxScore = Number(criterion?.maxScore ?? indicator?.score ?? 0);
    const percentage = maxScore ? Math.round((Number(answer.score || 0) / maxScore) * 10000) / 100 : 0;

    return {
      id: answer._id,
      criterion: criterion
        ? {
            id: criterion._id,
            name: criterion.name,
            description: criterion.description,
            maxScore: criterion.maxScore
          }
        : null,
      indicator: indicator
        ? {
            id: indicator._id,
            text: indicator.text,
            score: indicator.score
          }
        : null,
      levelName: answer.levelName,
      value: answer.value,
      score: answer.score,
      maxScore,
      percentage,
      observation: answer.observation
    };
  });

  const strengths = answers.filter((answer) => answer.maxScore > 0 && answer.percentage >= 80);
  const improvements = answers.filter((answer) => answer.maxScore > 0 && answer.percentage < 70);

  return {
    id: evaluation._id,
    student: evaluation.student,
    evaluator: evaluation.evaluator,
    task: evaluation.task,
    instrument: {
      id: instrument?._id,
      title: instrument?.title,
      description: instrument?.description,
      type: instrument?.type,
      maxScore: instrument?.maxScore
    },
    score: evaluation.score,
    maxScore: evaluation.maxScore,
    percentage: evaluation.percentage,
    feedback: evaluation.feedback,
    suggestions: evaluation.suggestions,
    studentReportEnabled: evaluation.studentReportEnabled,
    answers,
    strengths,
    improvements,
    evaluatedAt: evaluation.evaluatedAt,
    publishedAt: evaluation.publishedAt
  };
}

function buildFinalGrade(evaluations) {
  const finalGrade = calculateFinalGrade(evaluations);

  return {
    ...finalGrade,
    evaluations: evaluations.map((evaluation) => ({
      id: evaluation._id,
      task: evaluation.task
        ? {
            id: evaluation.task._id,
            title: evaluation.task.title,
            weight: evaluation.task.weight,
            dueDate: evaluation.task.dueDate
          }
        : null,
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      percentage: evaluation.percentage,
      publishedAt: evaluation.publishedAt,
      evaluatedAt: evaluation.evaluatedAt
    }))
  };
}

async function getResultForUser(req, id) {
  const evaluation = await Evaluation.findOne({
    _id: id,
    ...resultScope(req)
  }).populate(resultPopulate);

  if (!evaluation) {
    throw new AppError('Resultado no encontrado', 404);
  }

  return evaluation;
}

export const getMyResults = asyncHandler(async (req, res) => {
  if (req.user.role !== USER_ROLES.STUDENT) {
    throw new AppError('Este endpoint esta disponible solo para estudiantes', 403);
  }

  const { taskId, page, limit } = req.validated.query;
  const filter = {
    ...resultScope(req)
  };

  if (taskId) filter.task = taskId;

  const skip = (page - 1) * limit;
  const [evaluations, total] = await Promise.all([
    Evaluation.find(filter).populate(resultPopulate).sort({ publishedAt: -1, evaluatedAt: -1 }).skip(skip).limit(limit),
    Evaluation.countDocuments(filter)
  ]);

  res.json({
    results: evaluations.map(buildResult),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const getStudentResults = asyncHandler(async (req, res) => {
  const { studentId } = req.validated.params;
  const { taskId, page, limit } = req.validated.query;
  const filter = {
    ...resultScope(req),
    student: studentId
  };

  if (req.user.role === USER_ROLES.STUDENT && String(req.user._id) !== studentId) {
    throw new AppError('No tienes permiso para ver estos resultados', 403);
  }

  if (taskId) filter.task = taskId;

  const skip = (page - 1) * limit;
  const [evaluations, total] = await Promise.all([
    Evaluation.find(filter).populate(resultPopulate).sort({ publishedAt: -1, evaluatedAt: -1 }).skip(skip).limit(limit),
    Evaluation.countDocuments(filter)
  ]);

  res.json({
    results: evaluations.map(buildResult),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const getResultByEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await getResultForUser(req, req.validated.params.id);

  res.json({
    result: buildResult(evaluation)
  });
});

export const getMyFinalGrade = asyncHandler(async (req, res) => {
  if (req.user.role !== USER_ROLES.STUDENT) {
    throw new AppError('Este endpoint esta disponible solo para estudiantes', 403);
  }

  const evaluations = await Evaluation.find(resultScope(req))
    .populate({ path: 'task', select: 'title weight dueDate' })
    .sort({ publishedAt: -1, evaluatedAt: -1 });

  res.json({
    finalGrade: buildFinalGrade(evaluations)
  });
});

export const getStudentFinalGrade = asyncHandler(async (req, res) => {
  const { studentId } = req.validated.params;

  if (req.user.role === USER_ROLES.STUDENT && String(req.user._id) !== studentId) {
    throw new AppError('No tienes permiso para ver esta nota final', 403);
  }

  const evaluations = await Evaluation.find({
    ...resultScope(req),
    student: studentId
  })
    .populate({ path: 'task', select: 'title weight dueDate' })
    .sort({ publishedAt: -1, evaluatedAt: -1 });

  res.json({
    finalGrade: buildFinalGrade(evaluations)
  });
});
