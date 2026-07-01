import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import { createEvaluatorInvitation, validateInvitation } from '../controllers/invitation.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  createEvaluatorInvitationSchema,
  validateInvitationSchema
} from '../validators/invitation.validator.js';

const router = Router();

router.post(
  '/evaluator',
  protect,
  checkUserStatus,
  authorize(USER_ROLES.ADMIN),
  validateRequest(createEvaluatorInvitationSchema),
  createEvaluatorInvitation
);

router.get('/validate/:token', validateRequest(validateInvitationSchema), validateInvitation);

export default router;
