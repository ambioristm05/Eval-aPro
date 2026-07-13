import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import {
  createEvaluation,
  deleteEvaluation,
  getEvaluationById,
  getEvaluationCount,
  getEvaluations,
  getEvaluationsByStudent,
  publishEvaluation,
  updateEvaluation
} from '../controllers/evaluation.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  createEvaluationSchema,
  evaluationIdSchema,
  listEvaluationsSchema,
  studentEvaluationsSchema,
  updateEvaluationSchema
} from '../validators/evaluation.validator.js';

const router = Router();

router.use(protect, checkUserStatus);

router.get(
  '/count',
  authorize(USER_ROLES.STUDENT),
  getEvaluationCount
);

router
  .route('/')
  .post(authorize(USER_ROLES.EVALUATOR), validateRequest(createEvaluationSchema), createEvaluation)
  .get(
    authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR, USER_ROLES.STUDENT),
    validateRequest(listEvaluationsSchema),
    getEvaluations
  );

router.get(
  '/student/:studentId',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR, USER_ROLES.STUDENT),
  validateRequest(studentEvaluationsSchema),
  getEvaluationsByStudent
);

router.patch(
  '/:id/publish',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(evaluationIdSchema),
  publishEvaluation
);

router
  .route('/:id')
  .get(
    authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR, USER_ROLES.STUDENT),
    validateRequest(evaluationIdSchema),
    getEvaluationById
  )
  .patch(authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR), validateRequest(updateEvaluationSchema), updateEvaluation)
  .delete(authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR), validateRequest(evaluationIdSchema), deleteEvaluation);

export default router;
