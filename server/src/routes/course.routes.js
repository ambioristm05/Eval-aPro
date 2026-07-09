import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import {
  createCourse,
  createModuleForCourse,
  deleteCourse,
  deleteCoursePermanent,
  getCourseById,
  getCourseModules,
  getCourses,
  updateCourse
} from '../controllers/course.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  courseIdSchema,
  courseModulesSchema,
  createCourseSchema,
  createModuleSchema,
  listCoursesSchema,
  updateCourseSchema
} from '../validators/academicHierarchy.validator.js';

const router = Router();

router.use(protect, checkUserStatus);

router
  .route('/')
  .post(authorize(USER_ROLES.EVALUATOR), validateRequest(createCourseSchema), createCourse)
  .get(authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR), validateRequest(listCoursesSchema), getCourses);

router
  .route('/:courseId/modules')
  .post(authorize(USER_ROLES.EVALUATOR), validateRequest(createModuleSchema), createModuleForCourse)
  .get(
    authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
    validateRequest(courseModulesSchema),
    getCourseModules
  );

router
  .route('/:id')
  .get(authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR), validateRequest(courseIdSchema), getCourseById)
  .patch(authorize(USER_ROLES.EVALUATOR), validateRequest(updateCourseSchema), updateCourse)
  .delete(authorize(USER_ROLES.EVALUATOR), validateRequest(courseIdSchema), deleteCourse);

router.delete(
  '/:id/permanent',
  authorize(USER_ROLES.ADMIN),
  validateRequest(courseIdSchema),
  deleteCoursePermanent
);

export default router;
