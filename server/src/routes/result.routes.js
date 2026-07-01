import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import {
  getMyFinalGrade,
  getMyResults,
  getResultByEvaluation,
  getStudentFinalGrade,
  getStudentResults
} from '../controllers/result.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  finalGradeSchema,
  listMyResultsSchema,
  resultIdSchema,
  studentFinalGradeSchema,
  studentResultsSchema
} from '../validators/result.validator.js';

const router = Router();

router.use(protect, checkUserStatus);

router.get('/final-grade/me', authorize(USER_ROLES.STUDENT), validateRequest(finalGradeSchema), getMyFinalGrade);

router.get(
  '/final-grade/student/:studentId',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR, USER_ROLES.STUDENT),
  validateRequest(studentFinalGradeSchema),
  getStudentFinalGrade
);

router.get('/me', authorize(USER_ROLES.STUDENT), validateRequest(listMyResultsSchema), getMyResults);

router.get(
  '/student/:studentId',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR, USER_ROLES.STUDENT),
  validateRequest(studentResultsSchema),
  getStudentResults
);

router.get(
  '/evaluation/:id',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR, USER_ROLES.STUDENT),
  validateRequest(resultIdSchema),
  getResultByEvaluation
);

export default router;
