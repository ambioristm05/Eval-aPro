import { EVALUATION_STATUSES } from '../constants/evaluation.constants.js';
import { USER_ROLES, USER_STATUSES } from '../constants/user.constants.js';
import { Evaluation } from '../models/Evaluation.js';
import { Group } from '../models/Group.js';
import { Instrument } from '../models/Instrument.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function evaluatorScope(req) {
  if (req.user.role === USER_ROLES.ADMIN) return {};
  return { evaluator: req.user._id };
}

function scopedMatch(req, extra = {}) {
  return {
    ...evaluatorScope(req),
    ...extra
  };
}

async function countByField(Model, field, match = {}) {
  const rows = await Model.aggregate([
    { $match: match },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  return rows.reduce((acc, row) => {
    acc[row._id || 'undefined'] = row.count;
    return acc;
  }, {});
}

async function evaluationSummary(match) {
  const [summary = null] = await Evaluation.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        average: { $avg: '$percentage' },
        highest: { $max: '$percentage' },
        lowest: { $min: '$percentage' }
      }
    }
  ]);

  return {
    count: summary?.count || 0,
    average: Math.round((summary?.average || 0) * 100) / 100,
    highest: summary?.highest || 0,
    lowest: summary?.lowest || 0
  };
}

async function scoreDistribution(match) {
  const rows = await Evaluation.aggregate([
    { $match: match },
    {
      $bucket: {
        groupBy: '$percentage',
        boundaries: [0, 60, 70, 80, 90, 101],
        default: 'sin_rango',
        output: { count: { $sum: 1 } }
      }
    }
  ]);

  const labels = {
    0: '0-59',
    60: '60-69',
    70: '70-79',
    80: '80-89',
    90: '90-100'
  };

  return rows.reduce((acc, row) => {
    acc[labels[row._id] || row._id] = row.count;
    return acc;
  }, {});
}

async function ensureGroupForStats(req, groupId) {
  const group = await Group.findOne({
    _id: groupId,
    ...evaluatorScope(req)
  }).populate('students', 'name email status');

  if (!group) throw new AppError('Grupo no encontrado', 404);
  return group;
}

async function ensureTaskForStats(req, taskId) {
  const task = await Task.findOne({
    _id: taskId,
    ...evaluatorScope(req)
  }).populate('group', 'name status students');

  if (!task) throw new AppError('Tarea no encontrada', 404);
  return task;
}

async function ensureInstrumentForStats(req, instrumentId) {
  const instrument = await Instrument.findOne({
    _id: instrumentId,
    ...evaluatorScope(req)
  });

  if (!instrument) throw new AppError('Instrumento no encontrado', 404);
  return instrument;
}

export const getOverviewStatistics = asyncHandler(async (req, res) => {
  const userMatch = req.user.role === USER_ROLES.ADMIN ? {} : { groups: { $in: await Group.find(evaluatorScope(req)).distinct('_id') } };
  const evaluationMatch = scopedMatch(req);

  const [
    totalGroups,
    totalTasks,
    totalInstruments,
    totalEvaluations,
    totalStudents,
    usersByStatus,
    tasksByStatus,
    instrumentsByStatus,
    evaluationsByStatus,
    publishedSummary,
    publishedDistribution
  ] = await Promise.all([
    Group.countDocuments(evaluatorScope(req)),
    Task.countDocuments(evaluatorScope(req)),
    Instrument.countDocuments(evaluatorScope(req)),
    Evaluation.countDocuments(evaluationMatch),
    User.countDocuments({ role: USER_ROLES.STUDENT, ...userMatch }),
    countByField(User, 'status', { role: USER_ROLES.STUDENT, ...userMatch }),
    countByField(Task, 'status', evaluatorScope(req)),
    countByField(Instrument, 'status', evaluatorScope(req)),
    countByField(Evaluation, 'status', evaluationMatch),
    evaluationSummary({ ...evaluationMatch, status: EVALUATION_STATUSES.PUBLISHED }),
    scoreDistribution({ ...evaluationMatch, status: EVALUATION_STATUSES.PUBLISHED })
  ]);

  res.json({
    statistics: {
      totals: {
        students: totalStudents,
        groups: totalGroups,
        tasks: totalTasks,
        instruments: totalInstruments,
        evaluations: totalEvaluations
      },
      distributions: {
        studentsByStatus: usersByStatus,
        tasksByStatus,
        instrumentsByStatus,
        evaluationsByStatus,
        scores: publishedDistribution
      },
      performance: publishedSummary,
      generatedAt: new Date().toISOString()
    }
  });
});

export const getGroupStatistics = asyncHandler(async (req, res) => {
  const group = await ensureGroupForStats(req, req.validated.params.groupId);
  const studentIds = group.students.map((student) => student._id);
  const match = {
    ...scopedMatch(req),
    status: EVALUATION_STATUSES.PUBLISHED,
    student: { $in: studentIds }
  };

  const [summary, distribution, topStudents] = await Promise.all([
    evaluationSummary(match),
    scoreDistribution(match),
    Evaluation.aggregate([
      { $match: match },
      { $group: { _id: '$student', average: { $avg: '$percentage' }, evaluations: { $sum: 1 } } },
      { $sort: { average: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
      { $project: { _id: 0, student: { _id: '$student._id', name: '$student.name', email: '$student.email' }, average: { $round: ['$average', 2] }, evaluations: 1 } }
    ])
  ]);

  res.json({
    statistics: {
      group,
      performance: summary,
      distribution,
      topStudents,
      generatedAt: new Date().toISOString()
    }
  });
});

export const getTaskStatistics = asyncHandler(async (req, res) => {
  const task = await ensureTaskForStats(req, req.validated.params.taskId);
  const match = {
    ...scopedMatch(req),
    status: EVALUATION_STATUSES.PUBLISHED,
    task: task._id
  };

  const [summary, distribution, completion] = await Promise.all([
    evaluationSummary(match),
    scoreDistribution(match),
    Evaluation.countDocuments(match)
  ]);
  const assignedCount = task.group?.students?.length || task.students.length;

  res.json({
    statistics: {
      task,
      performance: summary,
      distribution,
      completion: {
        assigned: assignedCount,
        evaluated: completion,
        rate: assignedCount ? Math.round((completion / assignedCount) * 10000) / 100 : 0
      },
      generatedAt: new Date().toISOString()
    }
  });
});

export const getInstrumentStatistics = asyncHandler(async (req, res) => {
  const instrument = await ensureInstrumentForStats(req, req.validated.params.instrumentId);
  const match = {
    ...scopedMatch(req),
    status: EVALUATION_STATUSES.PUBLISHED,
    instrument: instrument._id
  };

  const [summary, distribution, usageByTask] = await Promise.all([
    evaluationSummary(match),
    scoreDistribution(match),
    Evaluation.aggregate([
      { $match: match },
      { $group: { _id: '$task', evaluations: { $sum: 1 }, average: { $avg: '$percentage' } } },
      { $sort: { evaluations: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'tasks', localField: '_id', foreignField: '_id', as: 'task' } },
      { $unwind: '$task' },
      { $project: { _id: 0, task: { _id: '$task._id', title: '$task.title' }, evaluations: 1, average: { $round: ['$average', 2] } } }
    ])
  ]);

  res.json({
    statistics: {
      instrument,
      performance: summary,
      distribution,
      usageByTask,
      generatedAt: new Date().toISOString()
    }
  });
});
