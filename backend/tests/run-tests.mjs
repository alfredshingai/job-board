/**
 * Test orchestrator: starts an embedded Postgres, pushes the Prisma schema,
 * runs Vitest, then shuts everything down. `npm test` runs this file.
 *
 * It exports DATABASE_URL *and* JWT_SECRET so the suite never accidentally
 * runs against your development database — integration suites additionally
 * assert the URL points at the `jobboard_test` database before touching data.
 */
import { spawnSync } from 'node:child_process';
import { startTestDb, TEST_DB_URL } from './setup/test-db.mjs';

const TEST_ENV = {
  DATABASE_URL: TEST_DB_URL,
  JWT_SECRET: 'test-secret-that-is-long-enough-1234567890',
  NODE_ENV: 'test',
  CORS_ORIGIN: 'http://localhost:5173',
};

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32', // resolve .cmd shims on Windows
    env: { ...process.env, ...TEST_ENV },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log('🐘 Starting embedded Postgres for tests…');
const pg = await startTestDb();

try {
  run('npx', ['prisma', 'db', 'push', '--skip-generate']);
  run('npx', ['vitest', 'run']);
} finally {
  console.log('🐘 Stopping embedded Postgres…');
  await pg.stop();
}
