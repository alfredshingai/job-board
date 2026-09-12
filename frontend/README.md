# DevHire Web — React 19 + Vite + Tailwind

SPA for the DevHire job board. See root `../README.md`.

## Quick Start

```bash
cp .env.example .env  # VITE_API_URL=http://localhost:4000
npm install
npm run dev           # http://localhost:5173
npm run build         # tsc -b && vite build → dist/
npm run preview
```

## Env

```
VITE_API_URL=http://localhost:4000        # or https://your-render-api.onrender.com
```

## Structure

```
src/
├── api/client.ts      fetch wrapper + API_URL from VITE_API_URL
├── api/types.ts       Job, Paginated, AuthUser
├── context/AuthContext  login/register/logout, localStorage, useAuth()
├── components/Navbar, JobCard, Filters, Pagination
├── pages/
│   ├── Home           hero + popular tags + latest 6 jobs
│   ├── Jobs           filters + pagination + grid
│   ├── JobDetail      salary card + apply CTA
│   ├── Dashboard      COMPANY-only: company profile + CRUD jobs
│   └── Admin          ADMIN-only: stats + moderation queue
├── App.tsx            BrowserRouter + Layout + Routes
├── main.tsx
└── index.css          @import "tailwindcss"; + theme
```

## Deployment (Vercel)

Root Directory: `frontend`. Build: `npm run build`. Output: `dist`. Env: `VITE_API_URL=https://<render-app>.onrender.com`. No `vercel.json` needed for SPA.

Local prod check: `npm run build && npm run preview` → http://localhost:4173
