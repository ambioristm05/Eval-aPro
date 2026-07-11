import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import {
  createMessage,
  getMessageThread,
  listMessageContacts,
} from '../controllers/message.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  createMessageSchema,
  listMessageContactsSchema,
  messageThreadSchema,
} from '../validators/message.validator.js';

const router = Router();

router.use(protect, checkUserStatus, authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR, USER_ROLES.STUDENT));

router.get('/contacts', validateRequest(listMessageContactsSchema), listMessageContacts);
router.get('/thread/:userId', validateRequest(messageThreadSchema), getMessageThread);
router.post('/', validateRequest(createMessageSchema), createMessage);

export default router;
