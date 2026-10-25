import { verifyToken } from '../utils/jwt.js';
import { unauthorized } from '../utils/errors.js';

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(unauthorized());
  try {
    req.userId = verifyToken(token);
    next();
  } catch {
    next(unauthorized('Session expired. Please log in again.'));
  }
}
