import { EVALUATION_STATUSES } from '../constants/evaluation.constants.js';
import { USER_ROLES } from '../constants/user.constants.js';
import { Evaluation } from '../models/Evaluation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  buildFinalGradesReport,
  buildGroupReport,
  buildInstrumentReport,
  buildStudentReport,
  buildTaskReport
} from '../services/report.service.js';

function evaluatorScope(req) {
  if (req.user.role === USER_ROLES.ADMIN) return {};
  return { evaluator: req.user._id };
}

export const getStudentReport = asyncHandler(async (req, res) => {
  const report = await buildStudentReport(req, req.validated.params.studentId);

  res.json({
    report
  });
});

export const updateStudentReportPermission = asyncHandler(async (req, res) => {
  const { studentId } = req.validated.params;
  const { enabled } = req.validated.body;
  const filter = {
    status: EVALUATION_STATUSES.PUBLISHED,
    student: studentId,
    ...evaluatorScope(req)
  };
  const result = await Evaluation.updateMany(filter, {
    $set: { studentReportEnabled: enabled }
  });

  res.json({
    message: enabled
      ? 'Impresión de reporte habilitada para el estudiante.'
      : 'Impresión de reporte deshabilitada para el estudiante.',
    studentReportEnabled: enabled,
    updated: result.modifiedCount ?? result.nModified ?? 0,
    matched: result.matchedCount ?? result.n ?? 0
  });
});

export const getGroupReport = asyncHandler(async (req, res) => {
  const report = await buildGroupReport(req, req.validated.params.groupId);

  res.json({
    report
  });
});

export const getTaskReport = asyncHandler(async (req, res) => {
  const report = await buildTaskReport(req, req.validated.params.taskId);

  res.json({
    report
  });
});

export const getFinalGradesReport = asyncHandler(async (req, res) => {
  const report = await buildFinalGradesReport(req, req.validated.params.groupId);

  res.json({
    report
  });
});

export const getInstrumentReport = asyncHandler(async (req, res) => {
  const report = await buildInstrumentReport(req, req.validated.params.instrumentId);

  res.json({
    report
  });
});
