# DevHire — Job Board (Monorepo)

Production-ready MVP for a recruiter-friendly job board. Recruiter-friendly, portfolio-grade, weekend-scope with clear extension paths. Deployed as **Express API on Render** + **React SPA on Vercel** + **PostgreSQL on Neon (free tier)**.

Live: `frontend → Vercel` · `backend → Render` · `DB → Neon`

![Stack](https://img.shields.io/badge/Backend-Express_5_+_Prisma_6_+_Postgres-black) ![Frontend](https://img.shields.io/badge/Frontend-React_19_+_Vite_6_+_Tailwind_4-black) ![Auth](https://img.shields.io/badge/Auth-JWT_+_bcryptjs-blue) ![Tests](https://img.shields.io/badge/Tests-Vitest_+_Supertest_+_embedded--postgres-green)

## Features

**Public**
- Job board with filters: keyword (title/description/company), location, workplace (remote/hybrid/onsite), salary range (overlap semantics), tags/skills
- Full-text search across title/description/company (ILIKE, upgrade path to `tsvector`)
- Pagination + sorting (newest, oldest, salary high/low — nulls last)
- Job detail with external `Apply` link + company card

**Auth & Roles**
- `USER` (seeker, default), `COMPANY` (recruiter, owns one company profile), `ADMIN` (moderates)
- JWT auth, role guards, `GET /api/auth/me`

**Company Dashboard** (`/dashboard` — COMPANY only)
- Create/edit company profile
- Create/edit/delete jobs (new edits → `PENDING_REVIEW` for re-moderation)
- Preview own pending/hidden jobs; optional in-app applications view (POST `/api/jobs/:id/applications`)

**Admin Panel** (`/admin` — ADMIN only)
- `GET /api/admin/stats` headline numbers
- Moderation queue with same search/filter/pagination but across all statuses
- `PATCH /api/admin/jobs/:id/status` → APPROVED | REJECTED | HIDDEN
- `PATCH /api/admin/jobs/:id/flag` → flag spam, `PATCH /api/admin/companies/:id/verified`

**Data**
- 36 realistic seeded jobs across 10 companies + 18 tags + demo accounts (see `backend/prisma/seed.ts`)
- Applications model (optional per spec) included

## Monorepo Layout

```
job-board/
├── backend/               Express 5 + TypeScript + Prisma + PostgreSQL
│   ├── prisma/schema.prisma
│   ├── prisma/seed.ts     36 jobs, idempotent
│   ├── src/app.ts         createApp() (testable)
│   ├── src/modules/auth|companies|jobs|admin|meta
│   └── tests/             Vitest + Supertest + embedded-postgres
├── frontend/              React 19 + Vite 6 + Tailwind 4 + React Router 7
│   ├── src/pages/Home|Jobs|JobDetail|Dashboard|Admin
│   └── src/context/AuthContext  JWT in localStorage
└── README.md              (this file)
```

## Tech Stack & Why

| Layer | Choice | Why over alternatives |
|-------|--------|----------------------|
| **Backend** | **Express 5** + TypeScript | Most hireable Node framework, tiny surface, explicit — over NestJS (too heavy for MVP) and Fastify (smaller ecosystem). Express 5 adds async route support. |
| **ORM** | **Prisma 6** | Best DX for Postgres + migrations + `include` + `connectOrCreate` for tags. Over TypeORM (decorator-heavy) / Drizzle (less mature). Uses `cuid` PKs, indexed `status+createdAt`. |
| **DB** | **PostgreSQL on Neon** | Free tier, pooled connection (`&sslmode=require`), Render↔Neon latency is low. Over SQLite (no `ILIKE`/`mode: insensitive`) and Mongo (no strong schema for job lifecycle). |
| **Auth** | **JWT + bcryptjs** | Stateless, fits Render free tier (no Redis). `bcryptjs` pure-JS (no native build). Over NextAuth/Auth0 (paid/overkill) and Lucia (newer). |
| **Validation** | **Zod** | Single source for body/query schemas, coerces `salaryMin` strings → numbers. |
| **Tests** | **Vitest + Supertest + embedded-postgres** | `embedded-postgres` downloads a throwaway PG cluster to `.tmp/test-db` — no Docker. Suites assert they run against `jobboard_test`. Over `pg-mem` (incomplete Prisma). |
| **Frontend** | **React 19 + Vite + Tailwind 4** | Vite 6 is fastest dev server; Tailwind 4 via `@tailwindcss/vite` is one plugin. Over Next.js (SSR unnecessary for SPA portfolio, Vercel still serves SPA). |
| **Routing** | **React Router 7** | File-free, SPA-friendly. Keeps auth in `AuthContext`. |

## Local Setup

### Prerequisites
- Node ≥ 20 (22 LTS recommended)
- PostgreSQL (optional — or use Neon)

### 1) Backend

```bash
cd backend
cp .env.example .env   # then fill DATABASE_URL + JWT_SECRET
npm install
npx prisma generate
# Local Postgres via Docker (optional):
# docker run --name jobboard-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16

# Dev (choose one):
npm run db:migrate   # creates migrations + applies (needs DATABASE_URL)
# or
npm run db:push      # no migration file, just syncs schema (quickest locally)

npm run seed         # 36 jobs, upserts — safe to re-run
npm run dev          # http://localhost:4000  (GET /api/health)
```

`.env` (backend):

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jobboard?schema=public"
JWT_SECRET="replace-with-48-random-hex-chars"
JWT_EXPIRES_IN="7d"
PORT=4000
CORS_ORIGIN="http://localhost:5173"
```

Demo accounts (seeded):

| email | password | role |
|-------|----------|------|
| admin@devhire.dev | Admin123! | ADMIN |
| recruiter@nimbuslabs.io | Company123! | COMPANY |
| candidate@example.com | Candidate123! | USER |

### 2) Frontend

```bash
cd frontend
cp .env.example .env  # VITE_API_URL=http://localhost:4000
npm install
npm run dev           # http://localhost:5173
npm run build         # typechecks + vite build → dist/
```

### 3) Tests (backend)

```bash
cd backend
npm test          # orchestrator: starts embedded-postgres on :55432, prisma db push, vitest run, stops
npm run test:unit # fast unit tests only (no DB)
```

`tests/run-tests.mjs` exports `DATABASE_URL=postgresql://...:55432/jobboard_test` so suites never touch your dev DB. Integration suites call `prisma.$executeRaw` to assert the URL before wiping data.

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | `{name,email,password,role?}` → `{user,token}` |
| POST | `/api/auth/login` | — | `{email,password}` → `{user,token}` |
| GET | `/api/auth/me` | Bearer | current user |
| GET | `/api/jobs` | — | public board, query: `q,location,workplace,salaryMin,salaryMax,tags,sort,page,pageSize` |
| GET | `/api/jobs/:id` | optional | detail (owners/admins can preview pending) |
| POST | `/api/jobs` | COMPANY | create (→ PENDING_REVIEW) |
| PATCH | `/api/jobs/:id` | owner/ADMIN | edit (non-admin resets to PENDING_REVIEW) |
| DELETE | `/api/jobs/:id` | owner/ADMIN | delete |
| POST | `/api/jobs/:id/applications` | Bearer | in-app apply |
| GET/POST/PATCH | `/api/companies/me` etc. | COMPANY | own company profile + `GET /api/companies/me/jobs` |
| PATCH | `/api/admin/jobs/:id/status` | ADMIN | approve/reject/hide |
| PATCH | `/api/admin/jobs/:id/flag` | ADMIN | flag spam |
| GET | `/api/admin/jobs` | ADMIN | moderation queue (same filters, `?status=`) |
| GET | `/api/admin/stats` | ADMIN | headline numbers |
| GET | `/api/stats` | — | public stats |
| GET | `/api/tags` | — | top 18 tags |
| GET | `/api/health` | — | liveness probe |

## Deployment

### Backend → Render (free)

1. Push to GitHub (this repo is already a monorepo — set Render **Root Directory** to `backend`).
2. Render > New Web Service > connect `alfredshingai/job-board` > Build command: `npm install && npx prisma generate && npm run build`
   Start command: `npm run start:migrate` (runs `prisma migrate deploy && node dist/index.js`).
   If you used `db:push` locally without migrations, commit the generated `prisma/migrations` folder or switch start to `node dist/index.js` + one-off `npx prisma db push`.
3. Environment:
   - `DATABASE_URL` = Neon pooled URL + `&sslmode=require` (Neon > Connection string > Pooled)
   - `JWT_SECRET` = `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   - `CORS_ORIGIN` = `https://your-vercel-app.vercel.app`
   - `NODE_ENV=production`, `PORT=10000` (Render injects PORT)
4. Health check path: `/api/health`
5. After first deploy: `npx prisma db seed` via Render Shell (or enable `prisma.seed` in build).

**Why `start:migrate`**: `prisma migrate deploy` is idempotent and required for Neon. The app's `env.ts:30-41` refuses to boot in production without `DATABASE_URL` and a strong `JWT_SECRET`.

### Frontend → Vercel (free)

1. Vercel > New Project > import `alfredshingai/job-board` > **Root Directory** `frontend`.
2. Build command: `npm run build` (runs `tsc -b && vite build`), Output: `dist`.
3. Environment: `VITE_API_URL=https://your-render-api.onrender.com` (no trailing slash).
4. No `vercel.json` needed — SPA fallback is handled by Vite's `index.html`. If you add API routes later, set `rewrites` to `/{.*} → /index.html`.
5. Redeploy after setting env.

### Database → Neon (free)

1. neon.tech > New Project > copy **Pooled** connection string.
2. Append `&sslmode=require` if missing.
3. Add to Render env as `DATABASE_URL`.
4. Optional: set `directUrl` in `schema.prisma` for migrations vs pooled `url` for runtime (not needed for MVP — pooled works for both).

## Tests

Critical paths covered:

- `tests/unit/password.test.ts` — bcrypt hash/verify
- `tests/unit/jwt.test.ts` — sign/verify/expired
- `tests/unit/schemas.test.ts` — Zod coercion for query/body
- `tests/integration/auth.test.ts` — register/login/me, conflict/unauthorized
- `tests/integration/jobs.test.ts` — public board (search/filter/pagination/sort), CRUD guards, applications dedupe
- `tests/integration/admin.test.ts` — moderation queue visibility, status/flag mutations, stats

Run with embedded Postgres so CI needs no Docker: `npm test` (`backend/tests/run-tests.mjs:28-37`).

## Extending

- **Full-text search**: add `@@to_tsquery` + GIN index, fallback to ILIKE (already there in `service.ts:buildWhere`).
- **Resumes**: swap `resumeUrl` string for S3 presigned uploads.
- **Emails**: queue apply notifications (BullMQ + Resend).
- **RBAC**: add `MODERATOR` role (reuse `requireRole`).
- **E2E**: add Playwright against seeded DB.

## License

MIT — portfolio use.
