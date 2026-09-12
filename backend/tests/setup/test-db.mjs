/**
 * Manages a throwaway PostgreSQL cluster for the test suite.
 * Uses the `embedded-postgres` package — no Docker or local install needed.
 * The cluster lives in `.tmp/test-db` and is reused between runs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = path.join(__dirname, '..', '..', '.tmp', 'test-db');
// WSL's /mnt/c is FAT-like (777) — Postgres init requires 0700. Fall back to /tmp on WSL/Linux when project is on /mnt/c.
const DATA_DIR = process.env.PG_DATA_DIR || (DEFAULT_DATA_DIR.startsWith('/mnt/c') && process.platform === 'linux' ? '/tmp/job-board-test-db' : DEFAULT_DATA_DIR);
const PORT = 55432;

/** Connection string the API under test should use. */
export const TEST_DB_URL = `postgresql://postgres:postgres@localhost:${PORT}/jobboard_test?schema=public`;

export async function startTestDb() {
  const needsInit = !fs.existsSync(path.join(DATA_DIR, 'PG_VERSION'));
  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: 'postgres',
    password: 'postgres',
    port: PORT,
    persistent: false,
  });

  if (needsInit) await pg.initialise();
  await pg.start();

  try {
    await pg.createDatabase('jobboard_test');
  } catch (err) {
    // The database persists between runs — that's fine.
    if (!String(err).includes('already exists')) throw err;
  }
  return pg;
}

/** Wipes the data directory (use if a previous run crashed uncleanly). */
export function cleanDataDir() {
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
}

// Standalone usage: `node tests/setup/test-db.mjs up|clean` — handy while
// developing against a real local Postgres without Docker.
if (process.argv[1] && process.argv[1].endsWith('test-db.mjs')) {
  const command = process.argv[2];
  if (command === 'clean') {
    cleanDataDir();
    console.log('Test DB data dir removed.');
    process.exit(0);
  }
  if (command === 'up') {
    const pg = await startTestDb();
    console.log(`Test Postgres running on :${PORT}\n  ${TEST_DB_URL}\nPress Ctrl+C to stop.`);
    process.on('SIGINT', async () => {
      await pg.stop();
      process.exit(0);
    });
  }
}
