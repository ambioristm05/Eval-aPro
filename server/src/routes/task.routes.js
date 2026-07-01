import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import { createTask, deleteTask, getTaskById, getTasks, updateTask } from '../controllers/task.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { createTaskSchema, listTasksSchema, taskIdSchema, updateTaskSchema } from '../validators/task.validator.js';

const router = Router();

router.use(protect, checkUserStatus);

router
  .route('/')
  .post(authorize(USER_ROLES.EVALUATOR), validateRequest(createTaskSchema), createTask)
  .get(authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR, USER_ROLES.STUDENT), validateRequest(listTasksSchema), getTasks);

router
  .route('/:id')
  .get(authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR, USER_ROLES.STUDENT), validateRequest(taskIdSchema), getTaskById)
  .patch(authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR), validateRequest(updateTaskSchema), updateTask)
  .delete(authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR), validateRequest(taskIdSchema), deleteTask);

export default router;
