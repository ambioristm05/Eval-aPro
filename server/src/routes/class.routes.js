import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import { deleteClass, deleteClassPermanent, getClassById, updateClass } from '../controllers/class.controller.js';
import { createTaskForClass, getClassTasks } from '../controllers/task.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { classIdSchema, updateClassSchema } from '../validators/academicHierarchy.validator.js';
import { createClassTaskSchema, listClassTasksSchema } from '../validators/task.validator.js';

const router = Router();

router.use(protect, checkUserStatus);

router
  .route('/:classId/tasks')
  .post(authorize(USER_ROLES.EVALUATOR), validateRequest(createClassTaskSchema), createTaskForClass)
  .get(
    authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
    validateRequest(listClassTasksSchema),
    getClassTasks
  );

router
  .route('/:id')
  .get(authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR), validateRequest(classIdSchema), getClassById)
  .patch(authorize(USER_ROLES.EVALUATOR), validateRequest(updateClassSchema), updateClass)
  .delete(authorize(USER_ROLES.EVALUATOR), validateRequest(classIdSchema), deleteClass);

router.delete(
  '/:id/permanent',
  authorize(USER_ROLES.ADMIN),
  validateRequest(classIdSchema),
  deleteClassPermanent
);

export default router;
