import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import {
  changeMyPassword,
  createStudent,
  deleteMyAccount,
  deleteStudent,
  deleteUserPermanent,
  getEvaluators,
  getMyProfile,
  getStudentById,
  getStudents,
  reactivateStudent,
  suspendStudent,
  updateMyProfile
} from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  changeMyPasswordSchema,
  createStudentSchema,
  deleteMyAccountSchema,
  deleteStudentSchema,
  deleteUserPermanentSchema,
  listEvaluatorsSchema,
  listStudentsSchema,
  reactivateStudentSchema,
  studentIdSchema,
  suspendStudentSchema,
  updateMyProfileSchema
} from '../validators/user.validator.js';

const router = Router();

router.use(protect, checkUserStatus);

router.get('/me', getMyProfile);
router.patch('/me', validateRequest(updateMyProfileSchema), updateMyProfile);
router.patch('/me/password', validateRequest(changeMyPasswordSchema), changeMyPassword);
router.delete('/me', validateRequest(deleteMyAccountSchema), deleteMyAccount);

router.get('/evaluators', authorize(USER_ROLES.ADMIN), validateRequest(listEvaluatorsSchema), getEvaluators);

router.delete(
  '/:id/permanent',
  authorize(USER_ROLES.ADMIN),
  validateRequest(deleteUserPermanentSchema),
  deleteUserPermanent
);

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
