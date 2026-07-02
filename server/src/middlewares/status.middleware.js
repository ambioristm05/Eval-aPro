import { BLOCKED_USER_STATUSES, USER_STATUSES } from '../constants/user.constants.js';
import { AppError } from '../utils/AppError.js';

export function checkUserStatus(req, res, next) {
  if (!req.user) {
    throw new AppError('No autenticado', 401);
  }

  if (BLOCKED_USER_STATUSES.includes(req.user.status)) {
    throw new AppError('Tu cuenta no está activa', 403);
  }

  if (req.user.status === USER_STATUSES.PENDING) {
    throw new AppError('Tu cuenta está pendiente de aprobación', 403);
  }

  next();
}

export const requireActiveUser = checkUserStatus;
