import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

export function notFoundHandler(_req, _res, next) {
  next(new AppError(404, 'Route not found'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: err.issues[0]?.message || 'Invalid input',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }
  if (err?.name === 'CastError') {
    return res.status(400).json({ error: { message: 'Invalid id' } });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ error: { message: 'That already exists' } });
  }
  console.error(err);
  res.status(500).json({ error: { message: 'Something went wrong' } });
}
