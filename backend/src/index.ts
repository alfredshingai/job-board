import { createApp } from './app.js';
import env from './config/env.js';
import { prisma } from './lib/prisma.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

/**
 * Graceful shutdown: stop accepting connections, close the DB pool, exit.
 * Keeps Render deploys/restarts from cutting requests mid-flight.
 */
async function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received — shutting down…`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Force-exit if connections don't drain in 10s.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
