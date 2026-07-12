import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { updateSettingsSchema } from '../validators/settings.validator.js';
import { USER_ROLES } from '../constants/user.constants.js';

const router = Router();

router.use(protect, checkUserStatus, authorize(USER_ROLES.ADMIN));

router.get('/', getSettings);
router.patch('/', validateRequest(updateSettingsSchema), updateSettings);

export default router;
