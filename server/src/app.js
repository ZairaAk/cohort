import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { requireAuth } from './middleware/auth.js';
import authRoutes from './routes/auth.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }), authRoutes);

  // Everything below requires a logged-in user.
  app.use('/api', requireAuth);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
