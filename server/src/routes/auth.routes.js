import { Router } from 'express';
import {
  getMe,
  login,
  logout,
  registerEvaluatorWithInvitation,
  registerStudent
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  loginSchema,
  registerEvaluatorInvitationSchema,
  registerStudentSchema
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register/student', validateRequest(registerStudentSchema), registerStudent);
router.post(
  '/register/evaluator/invitation',
  validateRequest(registerEvaluatorInvitationSchema),
  registerEvaluatorWithInvitation
);
router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', logout);
router.get('/me', protect, checkUserStatus, getMe);

export default router;
