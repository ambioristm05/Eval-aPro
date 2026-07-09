import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import {
  createClassForModule,
  deleteModule,
  deleteModulePermanent,
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

router.use(protect, checkUserStatus);

router
  .route('/:moduleId/classes')
  .post(authorize(USER_ROLES.EVALUATOR), validateRequest(createClassSchema), createClassForModule)
  .get(
    authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
    validateRequest(moduleClassesSchema),
    getModuleClasses
  );

router
  .route('/:id')
  .get(authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR), validateRequest(moduleIdSchema), getModuleById)
  .patch(authorize(USER_ROLES.EVALUATOR), validateRequest(updateModuleSchema), updateModule)
  .delete(authorize(USER_ROLES.EVALUATOR), validateRequest(moduleIdSchema), deleteModule);

router.delete(
  '/:id/permanent',
  authorize(USER_ROLES.ADMIN),
  validateRequest(moduleIdSchema),
  deleteModulePermanent
);

export default router;
