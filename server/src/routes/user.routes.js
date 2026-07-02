import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import {
  createStudent,
  deleteMyAccount,
  deleteStudent,
  getStudentById,
  getStudents,
  reactivateStudent,
  suspendStudent
} from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  createStudentSchema,
  deleteMyAccountSchema,
  deleteStudentSchema,
  listStudentsSchema,
  reactivateStudentSchema,
  studentIdSchema,
  suspendStudentSchema
} from '../validators/user.validator.js';

const router = Router();

router.use(protect, checkUserStatus);

router.delete('/me', validateRequest(deleteMyAccountSchema), deleteMyAccount);

router.post(
  '/students',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(createStudentSchema),
  createStudent
);

router.get(
  '/students',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(listStudentsSchema),
  getStudents
);

router.get(
  '/students/:id',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(studentIdSchema),
  getStudentById
);

router.patch(
  '/:id/suspend',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(suspendStudentSchema),
  suspendStudent
);

router.patch(
  '/:id/reactivate',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(reactivateStudentSchema),
  reactivateStudent
);

router.delete(
  '/:id',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(deleteStudentSchema),
  deleteStudent
);

export default router;
