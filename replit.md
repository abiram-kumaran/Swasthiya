# CareGrid AI

A district healthcare operations engine — an AI-powered, full-stack web app for managing Primary Health Centres (PHCs) and Community Health Centres (CHCs). Built as a Google Hackathon prototype.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/caregrid run dev` — run the frontend (proxied at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS, Framer Motion, Wouter, shadcn/ui
- API: Express 5 + Zod validation
- DB: PostgreSQL + Drizzle ORM
- Codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (centers, inventory, logs, attendance, dispatch, chat)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/caregrid/src/pages/` — four main views (dashboard, frontline, patient, dispatch)

## Four Views

1. **`/dashboard`** — District Command Dashboard (desktop 3-pane: map + KPI cards + AI Action Feed)
2. **`/frontline`** — Frontline Staff Portal (mobile-first: OCR scan, voice log, attendance)
3. **`/patient`** — Patient WhatsApp Bot interface (chat UI with AI triage)
4. **`/dispatch`** — Logistics Dispatch App (dark mode, route tracking, confirm pickup/delivery)

## Demo Data State

- PHC-Alpha: CRITICAL — 92 patients, 0 beds available, Paracetamol at 5 units
- PHC-North: WARNING — 60 patients, moderate stock
- PHC-East: HEALTHY — 30 patients, adequate stock
- CHC-Central: HEALTHY — 40 patients, 5,000 unit Paracetamol surplus ready for redistribution

## Architecture decisions

- OpenAPI-first: all contracts defined in YAML, codegen produces typed React Query hooks + Zod validators
- `serializeDates()` helper converts Drizzle Date objects to ISO strings before Zod parsing
- Bot replies in `/chat` are server-side NLP (keyword matching) — no external AI key required for demo
- AI redistribution engine queries inventory cross-center to surface real surplus/shortage matches
- Dark mode on `/dispatch` is scoped via `useEffect` toggling `.dark` class on `document.documentElement`

## User preferences

_Populate as you build._

## Gotchas

- Always run codegen after changing `openapi.yaml`
- `serializeDates()` must wrap any DB result before `.parse()` — Drizzle timestamps come back as Date objects
- The frontend uses `BASE_URL` from Vite env for all routing (wouter base)

## Pointers

- See the `pnpm-workspace` skill for workspace structure details
