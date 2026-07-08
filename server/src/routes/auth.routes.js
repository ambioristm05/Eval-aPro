import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  forgotPassword,
  getMe,
  login,
  logout,
  registerEvaluatorWithInvitation,
  registerStudent,
  resetPassword
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerEvaluatorInvitationSchema,
  registerStudentSchema,
  resetPasswordSchema
} from '../validators/auth.validator.js';

const router = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    message: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.'
  }
});
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Demasiadas solicitudes de restablecimiento. Intenta nuevamente en 15 minutos.'
  }
});

router.post('/register/student', validateRequest(registerStudentSchema), registerStudent);
router.post(
  '/register/evaluator/invitation',
  validateRequest(registerEvaluatorInvitationSchema),
  registerEvaluatorWithInvitation
);
router.post('/login', loginLimiter, validateRequest(loginSchema), login);
router.post('/forgot-password', passwordResetLimiter, validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);
router.post('/logout', logout);
router.get('/me', protect, checkUserStatus, getMe);

export default router;
