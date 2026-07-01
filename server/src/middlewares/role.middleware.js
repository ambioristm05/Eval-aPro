import { AppError } from '../utils/AppError.js';

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('No autenticado', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('No tienes permiso para esta accion', 403);
    }

    next();
  };
}

export const requireRole = authorize;
