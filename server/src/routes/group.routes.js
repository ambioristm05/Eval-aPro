import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import {
  addStudentToGroup,
  createGroup,
  deleteGroup,
  getGroupById,
  getGroups,
  removeStudentFromGroup,
  updateGroup
} from '../controllers/group.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  addStudentToGroupSchema,
  createGroupSchema,
  groupIdSchema,
  listGroupsSchema,
  removeStudentFromGroupSchema,
  updateGroupSchema
} from '../validators/group.validator.js';

const router = Router();

router.use(protect, checkUserStatus);

router
  .route('/')
  .post(authorize(USER_ROLES.EVALUATOR), validateRequest(createGroupSchema), createGroup)
  .get(authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR), validateRequest(listGroupsSchema), getGroups);

router.post(
  '/:id/students',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(addStudentToGroupSchema),
  addStudentToGroup
);

router.delete(
  '/:id/students/:studentId',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(removeStudentFromGroupSchema),
  removeStudentFromGroup
);

router
  .route('/:id')
  .get(authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR), validateRequest(groupIdSchema), getGroupById)
  .patch(authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR), validateRequest(updateGroupSchema), updateGroup)
  .delete(authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR), validateRequest(groupIdSchema), deleteGroup);

export default router;
