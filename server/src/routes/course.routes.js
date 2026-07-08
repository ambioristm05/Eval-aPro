import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import {
  createCourse,
  createModuleForCourse,
  deleteCourse,
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

router.use(protect, checkUserStatus, authorize(USER_ROLES.EVALUATOR));

router
  .route('/')
  .post(validateRequest(createCourseSchema), createCourse)
  .get(validateRequest(listCoursesSchema), getCourses);

router
  .route('/:courseId/modules')
  .post(validateRequest(createModuleSchema), createModuleForCourse)
  .get(validateRequest(courseModulesSchema), getCourseModules);

router
  .route('/:id')
  .get(validateRequest(courseIdSchema), getCourseById)
  .patch(validateRequest(updateCourseSchema), updateCourse)
  .delete(validateRequest(courseIdSchema), deleteCourse);

export default router;
