import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants.js';
import {
  createInstrument,
  deleteInstrument,
  deleteInstrumentPermanent,
  getInstrumentById,
  getInstruments,
  updateInstrument
} from '../controllers/instrument.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkUserStatus } from '../middlewares/status.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  createInstrumentSchema,
  instrumentIdSchema,
  listInstrumentsSchema,
  updateInstrumentSchema
} from '../validators/instrument.validator.js';

const router = Router();

router.use(protect, checkUserStatus);

router
  .route('/')
  .post(authorize(USER_ROLES.EVALUATOR), validateRequest(createInstrumentSchema), createInstrument)
  .get(authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR), validateRequest(listInstrumentsSchema), getInstruments);

router
  .route('/:id')
  .get(authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR), validateRequest(instrumentIdSchema), getInstrumentById)
  .patch(authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR), validateRequest(updateInstrumentSchema), updateInstrument)
  .delete(authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR), validateRequest(instrumentIdSchema), deleteInstrument);

router.delete(
  '/:id/permanent',
  authorize(USER_ROLES.ADMIN, USER_ROLES.EVALUATOR),
  validateRequest(instrumentIdSchema),
  deleteInstrumentPermanent
);

export default router;
