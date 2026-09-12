import 'dotenv/config';
import { z } from 'zod';

/**
 * Central, validated app configuration.
 *
 * In production every variable is required — the app refuses to boot with a
 * bad config. In development we fall back to safe local defaults so you can
 * `npm run dev` right after copying `.env.example`.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().default(''),
  JWT_SECRET: z.string().default('dev-only-secret-change-me-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

if (env.NODE_ENV === 'production') {
  if (!env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.error('❌ DATABASE_URL is required in production.');
    process.exit(1);
  }
  if (env.JWT_SECRET.length < 32 || env.JWT_SECRET.startsWith('dev-only')) {
    // eslint-disable-next-line no-console
    console.error('❌ Set JWT_SECRET to a long random string in production.');
    process.exit(1);
  }
} else if (!env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.warn('⚠️  DATABASE_URL is not set — copy .env.example to .env and configure it.');
}

/** Origins allowed to call the API (comma-separated in the env var). */
export const corsOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);

export const isProduction = env.NODE_ENV === 'production';

export default env;
