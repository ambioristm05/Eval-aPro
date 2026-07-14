import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import { getAuditEntities, getAuditLogs } from '../controllers/audit.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';

const router = Router();

router.use(protect, checkUserStatus, authorize(USER_ROLES.ADMIN));

router.get('/', getAuditLogs);
router.get('/entities', getAuditEntities);

export default router;
