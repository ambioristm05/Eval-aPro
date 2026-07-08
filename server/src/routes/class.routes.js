import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import { deleteClass, getClassById, updateClass } from '../controllers/class.controller.js';
import { createTaskForClass, getClassTasks } from '../controllers/task.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { classIdSchema, updateClassSchema } from '../validators/academicHierarchy.validator.js';
import { createClassTaskSchema, listClassTasksSchema } from '../validators/task.validator.js';

const router = Router();

router.use(protect, checkUserStatus, authorize(USER_ROLES.EVALUATOR));

router
  .route('/:classId/tasks')
  .post(validateRequest(createClassTaskSchema), createTaskForClass)
  .get(validateRequest(listClassTasksSchema), getClassTasks);

router
  .route('/:id')
  .get(validateRequest(classIdSchema), getClassById)
  .patch(validateRequest(updateClassSchema), updateClass)
  .delete(validateRequest(classIdSchema), deleteClass);

export default router;
