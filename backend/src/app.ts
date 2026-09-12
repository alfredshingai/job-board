import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOrigins } from './config/env.js';
import authRoutes from './modules/auth/routes.js';
import companyRoutes from './modules/companies/routes.js';
import jobRoutes from './modules/jobs/routes.js';
import adminRoutes from './modules/admin/routes.js';
import metaRoutes from './modules/meta/routes.js';
import { notFoundHandler, errorHandler } from './middleware/errors.js';

/**
 * Builds the Express app. Kept separate from the server bootstrap in
 * `index.ts` so tests can import it without opening a port.
 */
export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  // Simple liveness probe used by Render health checks.
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/companies', companyRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', metaRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
