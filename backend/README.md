# DevHire API — Express 5 + Prisma + PostgreSQL

REST API for the DevHire job board. See root `../README.md` for full stack overview.

## Quick Start

```bash
cp .env.example .env   # set DATABASE_URL, JWT_SECRET
npm install
npx prisma generate
npm run db:push        # or npm run db:migrate (with migrations)
npm run seed           # 36 jobs + demo accounts
npm run dev            # http://localhost:4000
```

## Scripts

| Script | Description |
|--------|-------------|
| `dev` | `tsx watch src/index.ts` — reload on change |
| `build` | `tsc` → `dist/` |
| `start` | `node dist/index.js` |
| `start:migrate` | `prisma migrate deploy && node dist/index.js` (Render) |
| `lint` | `tsc --noEmit` (typecheck) |
| `db:migrate` | `prisma migrate dev` (creates migration) |
| `db:deploy` | `prisma migrate deploy` (prod) |
| `db:push` | `prisma db push` (no migration file) |
| `seed` | `tsx prisma/seed.ts` (idempotent) |
| `test` | `node tests/run-tests.mjs` (embedded Postgres) |
| `test:unit` | `vitest run tests/unit` |

## Env

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jobboard?schema=public"
JWT_SECRET="long-random-hex"
JWT_EXPIRES_IN="7d"
PORT=4000
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

Production guards in `src/config/env.ts:30-41`: refuses to boot without `DATABASE_URL` and a ≥32-char `JWT_SECRET`.

## Project Structure

```
src/
├── app.ts              createApp() — helmet, cors, json, routes, error handlers
├── index.ts            boots createApp(), graceful shutdown
├── config/env.ts      zod-validated env
├── lib/prisma.ts       PrismaClient singleton
├── middleware/auth.ts  requireAuth, optionalAuth, requireRole
├── middleware/validate.ts Zod body/query validator
├── modules/
│   ├── auth/           register/login/me
│   ├── companies/      POST/PATCH /api/companies/me, GET me/jobs
│   ├── jobs/           service.ts (buildWhere, listJobs, tag helpers) + routes.ts
│   ├── admin/          moderation queue + stats
│   └── meta/           /api/stats, /api/tags
├── utils/              jwt, password, pagination, serialize, errors
└── types/express.d.ts  req.user augmentation
```

Key implementation notes:
- `service.ts:buildWhere` — salary overlap: `salaryMax >= min && salaryMin <= max`; tags via `some: {tag: {name: {in}}}`; keyword ILIKE on `title/description/company.name`.
- `service.ts:tagLinksCreate/Replace` — `connectOrCreate` + `deleteMany` for tag normalization (lowercase, deduped).
- `middleware/validate.ts` — replaces `req.query`/`req.body` with parsed data (Express 5 getter-safe via defineProperty).
- `utils/params.ts` — handles Express 5's `string | string[]` params.

## Testing

```bash
npm test          # embedded-postgres on :55432, prisma db push, vitest, stop
npm run test:unit
```

`tests/setup/test-db.mjs` manages the cluster in `.tmp/test-db`. Suites assert `DATABASE_URL` contains `jobboard_test` before wiping.

## Deployment (Render)

Root Directory: `backend`. Build: `npm install && npx prisma generate && npm run build`. Start: `npm run start:migrate`. Health check: `/api/health`. Env: `DATABASE_URL` (Neon pooled + `&sslmode=require`), `JWT_SECRET`, `CORS_ORIGIN` (Vercel URL), `NODE_ENV=production`.
