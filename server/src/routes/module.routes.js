import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import {
  createClassForModule,
  deleteModule,
  getModuleById,
  getModuleClasses,
  updateModule
} from '../controllers/module.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  createClassSchema,
  moduleClassesSchema,
  moduleIdSchema,
  updateModuleSchema
} from '../validators/academicHierarchy.validator.js';

const router = Router();

router.use(protect, checkUserStatus, authorize(USER_ROLES.EVALUATOR));

router
  .route('/:moduleId/classes')
  .post(validateRequest(createClassSchema), createClassForModule)
  .get(validateRequest(moduleClassesSchema), getModuleClasses);

router
  .route('/:id')
  .get(validateRequest(moduleIdSchema), getModuleById)
  .patch(validateRequest(updateModuleSchema), updateModule)
  .delete(validateRequest(moduleIdSchema), deleteModule);

export default router;
