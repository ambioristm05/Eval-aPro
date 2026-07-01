import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import {
  getGroupStatistics,
  getInstrumentStatistics,
  getOverviewStatistics,
  getTaskStatistics
} from '../controllers/statistics.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  groupStatisticsSchema,
  instrumentStatisticsSchema,
  overviewStatisticsSchema,
  taskStatisticsSchema
} from '../validators/statistics.validator.js';

const router = Router();

router.use(protect, checkUserStatus, authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR));

router.get('/overview', validateRequest(overviewStatisticsSchema), getOverviewStatistics);
router.get('/groups/:groupId', validateRequest(groupStatisticsSchema), getGroupStatistics);
router.get('/tasks/:taskId', validateRequest(taskStatisticsSchema), getTaskStatistics);
router.get('/instruments/:instrumentId', validateRequest(instrumentStatisticsSchema), getInstrumentStatistics);

export default router;
