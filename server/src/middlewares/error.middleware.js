export function notFound(req, res, next) {
  const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const payload = {
    message: error.message || 'Error interno del servidor'
  };

  if (error.details) payload.details = error.details;
  if (process.env.NODE_ENV === 'development') payload.stack = error.stack;

  res.status(statusCode).json(payload);
}
