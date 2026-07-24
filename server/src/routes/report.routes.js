import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import {
  getFinalGradesReport,
  getGroupReport,
  getInstrumentReport,
  getStudentReport,
  getTaskReport,
  updateStudentReportPermission
} from '../controllers/report.controller.js';
import {
  csvFinalGradesReport,
  csvGroupReport,
  csvInstrumentReport,
  csvStudentReport,
  csvTaskReport,
  pdfFinalGradesReport,
  pdfGroupReport,
  pdfInstrumentReport,
  pdfStudentReport,
  pdfTaskReport,
  printFinalGradesReport,
  printGroupReport,
  printInstrumentReport,
  printStudentReport,
  printTaskReport,
  xlsxFinalGradesReport,
  xlsxGroupReport,
  xlsxInstrumentReport,
  xlsxStudentReport,
  xlsxTaskReport
} from '../controllers/print.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  groupReportSchema,
  instrumentReportSchema,
  studentReportPermissionSchema,
  studentReportSchema,
  taskReportSchema
} from '../validators/report.validator.js';

const router = Router();

router.use(protect, checkUserStatus);

router.patch(
  '/student/:studentId/print-permission',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(studentReportPermissionSchema),
  updateStudentReportPermission
);

router.get(
  '/student/:studentId/print',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR, USER_ROLES.STUDENT),
  validateRequest(studentReportSchema),
  printStudentReport
);

router.get(
  '/student/:studentId/pdf',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR, USER_ROLES.STUDENT),
  validateRequest(studentReportSchema),
  pdfStudentReport
);

router.get(
  '/student/:studentId/csv',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR, USER_ROLES.STUDENT),
  validateRequest(studentReportSchema),
  csvStudentReport
);

router.get(
  '/student/:studentId/xlsx',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR, USER_ROLES.STUDENT),
  validateRequest(studentReportSchema),
  xlsxStudentReport
);

router.get(
  '/student/:studentId',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR, USER_ROLES.STUDENT),
  validateRequest(studentReportSchema),
  getStudentReport
);

router.get(
  '/group/:groupId/print',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(groupReportSchema),
  printGroupReport
);

router.get(
  '/group/:groupId/pdf',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(groupReportSchema),
  pdfGroupReport
);

router.get(
  '/group/:groupId/csv',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(groupReportSchema),
  csvGroupReport
);

router.get(
  '/group/:groupId/xlsx',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(groupReportSchema),
  xlsxGroupReport
);

router.get(
  '/group/:groupId',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(groupReportSchema),
  getGroupReport
);

router.get(
  '/task/:taskId/print',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(taskReportSchema),
  printTaskReport
);

router.get(
  '/task/:taskId/pdf',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(taskReportSchema),
  pdfTaskReport
);

router.get(
  '/task/:taskId/csv',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(taskReportSchema),
  csvTaskReport
);

router.get(
  '/task/:taskId/xlsx',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(taskReportSchema),
  xlsxTaskReport
);

router.get(
  '/task/:taskId',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(taskReportSchema),
  getTaskReport
);

router.get(
  '/final-grades/:groupId/print',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(groupReportSchema),
  printFinalGradesReport
);

router.get(
  '/final-grades/:groupId/pdf',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(groupReportSchema),
  pdfFinalGradesReport
);

router.get(
  '/final-grades/:groupId/csv',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(groupReportSchema),
  csvFinalGradesReport
);

router.get(
  '/final-grades/:groupId/xlsx',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(groupReportSchema),
  xlsxFinalGradesReport
);

router.get(
  '/final-grades/:groupId',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(groupReportSchema),
  getFinalGradesReport
);

router.get(
  '/instruments/:instrumentId/print',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(instrumentReportSchema),
  printInstrumentReport
);

router.get(
  '/instruments/:instrumentId/pdf',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(instrumentReportSchema),
  pdfInstrumentReport
);

router.get(
  '/instruments/:instrumentId/csv',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(instrumentReportSchema),
  csvInstrumentReport
);

router.get(
  '/instruments/:instrumentId/xlsx',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(instrumentReportSchema),
  xlsxInstrumentReport
);

router.get(
  '/instruments/:instrumentId',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(instrumentReportSchema),
  getInstrumentReport
);

export default router;
