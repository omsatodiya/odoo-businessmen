# TransitOps

**Smart Transport Operations Platform** — a centralized system for managing vehicle, driver, dispatch, maintenance, and expense operations for a transport company.

It replaces the spreadsheets and manual logbooks many transport companies still rely on with a single system of record: every vehicle and driver has one true status, every dispatch is validated against real business rules before it's allowed to happen, and every role sees exactly the slice of the operation they're responsible for.

## What it does

Digitizes the full lifecycle of transport operations that most companies still run on spreadsheets:

- **Vehicle Registry** — master list of vehicles (reg no, type, capacity, odometer, acquisition cost, status).
- **Driver Management** — driver profiles with license category/expiry, safety score, and status.
- **Trip Dispatcher** — create, dispatch, complete, and cancel trips, with capacity/availability/license guards enforced server-side, not just in the UI.
- **Maintenance** — opening a maintenance record automatically pulls a vehicle out of the dispatch pool; closing it returns it (unless retired).
- **Fuel & Expenses** — fuel logs and other expenses (toll, parking, etc.), rolled up into per-vehicle operational cost.
- **Analytics** — fuel efficiency, fleet utilization, operational cost, and ROI per vehicle, with CSV export.
- **Dashboard** — fleet-wide KPIs, recent trips, and vehicle status breakdown.
- **Settings** — depot config and a read-only view of the RBAC matrix.

## Bonus Features

In addition to core features, TransitOps includes several premium, enterprise-grade capabilities:

- **Email Expiry Reminder Service** — Timezone-safe API scanning for driver license expiries at exactly 3 and 7 days. Dispatches warning emails via a local development fallback that saves formatted HTML previews to `tmp/sent-emails/`, plus a manual **Send Reminders** dispatcher action button.
- **Global Command Palette (Ctrl+K / ⌘K)** — Universal search overlay supporting fast app navigation, vehicle, driver, and trip lookups, dynamically filtered based on user permissions.
- **Print-to-PDF Optimized Views** — Custom print-friendly pages (`/analytics-print` and `/fuel-expenses-print`) styled specifically for browser print dialogs to generate clean PDF reports.
- **Responsive Light & Dark Modes** — Theme toggler embedded in the top header utilizing `next-themes` to render high-contrast light and dark views dynamically.
- **Advanced CSV Export** — Downloadable CSV report generator for fleet analytics, formatted cleanly to match dashboard metrics.
- **Enhanced Visual Scannability** — Clean font weight hierarchy, monospace badges for license/registration lookups, uppercase unit annotations (`KM`, `KG`, `₹`), and color-coded status badges.

## Tech Stack

### Core Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | React server components, REST API routing, and optimized builds |
| **Language** | TypeScript (Strict Mode) | Strong type-safety and interface validation across client and server |
| **Styling** | Tailwind CSS 4 | Modern, variable-based utility styling with fluid typography |
| **UI Components** | Shadcn UI | Premium, compact, and fully accessible primitive components |
| **Icons** | Lucide React | High-contrast vector iconography (emojis strictly avoided in UI) |
| **Animations** | Framer Motion | Smooth, lightweight layout transitions and UI micro-animations |
| **Database** | PostgreSQL | Robust relational storage for drivers, dispatches, and logs |
| **ORM** | Prisma 6 | Parameterized, N+1 query-safe database modeling and operations |
| **State Management**| Zustand | Global client-side store slices for active UI and permission layers |
| **Validation** | Zod | Server-side API payload sanitization and client-side form validation |

## Images

<img width="1917" height="927" alt="image" src="https://github.com/user-attachments/assets/57f9c0f1-32b7-4b3b-9d8f-fc962ed59ba6" />
<img width="1916" height="926" alt="image" src="https://github.com/user-attachments/assets/762838c4-60e8-4016-9145-0ae27a3b9550" />
<img width="1460" height="832" alt="image" src="https://github.com/user-attachments/assets/bd86a0cf-4222-4e2b-8d21-6efeee7f30c6" />
<img width="1917" height="931" alt="image" src="https://github.com/user-attachments/assets/80009cc7-1b63-4557-bb49-67424d2cda95" />


## Roles (RBAC)

One login, four roles, each scoped to a different slice of the app — see `lib/rbac.ts` for the exact access matrix:

| Role | Full access to | View-only |
|---|---|---|
| Fleet Manager | Fleet, Maintenance, Analytics, Settings | Dashboard |
| Dispatcher | Trips | Fleet, Settings, Dashboard |
| Safety Officer | Drivers | Trips, Settings, Dashboard |
| Financial Analyst | Fuel & Expenses, Analytics | Fleet, Settings, Dashboard |

Every status transition (vehicle/driver → On Trip, In Shop, etc.) is enforced centrally in `lib/services/*`, not scattered across route handlers, so the rules can't be bypassed by any one screen.

## Quick Start

```bash
pnpm install
docker compose up -d
npx prisma db push
pnpm db:generate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000` — you'll be redirected to `/login`.

**Demo logins** (shared password `Password123!`, also printed by `pnpm db:seed`):

| Role | Email |
|---|---|
| Fleet Manager | fleet.manager@transitops.in |
| Dispatcher | raven.k@transitops.in |
| Safety Officer | safety.officer@transitops.in |
| Financial Analyst | finance.analyst@transitops.in |

## Environment

Copy `.env.example` to `.env` and adjust before production:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/odoo_db?schema=public"
SESSION_SECRET="replace-with-a-long-random-string-openssl-rand-base64-32"
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="masterKey"
MEILISEARCH_USERS_INDEX="users"
LOKI_PUSH_URL="http://localhost:3100/loki/api/v1/push"
LOG_LEVEL="info"
```

`SESSION_SECRET` signs the login session JWT — use a long random value (`openssl rand -base64 32`) outside local development. Use a strong Meilisearch key and database password in any shared/deployed environment.

## Infrastructure

`docker-compose.yml` includes:

- `postgres` — primary relational database with a persistent volume.
- `meilisearch` — typo-tolerant search engine, with a safe Postgres `ILIKE` fallback when it's offline/unconfigured (`lib/meilisearch.ts`).
- `loki` — log aggregation target for server-side structured JSON logs (`lib/logger.ts`), fail-silent if unreachable.

All services include health checks and persistent volumes.

## Useful Scripts

- `pnpm dev` — start the Next.js development server.
- `pnpm build` — create a production build.
- `pnpm lint` — run ESLint.
- `npx prisma db push` — sync `prisma/schema.prisma` to the database (no migration files by design, for fast iteration during development).
- `pnpm db:generate` — regenerate the Prisma Client.
- `pnpm db:seed` — reset and reseed the full demo dataset (users, vehicles, drivers, trips, maintenance, fuel logs, expenses). Safe to re-run anytime.
- `pnpm db:wipe` / `pnpm db:wipe:table <name>` — wipe all/one database table(s), with a confirmation prompt.

## Project Structure

```text
app/
  (app)/               RBAC-gated app shell: dashboard, fleet, drivers, trips,
                        maintenance, fuel-expenses, analytics, settings
  api/                 Route handlers — Zod-validated, respond via lib/api.ts's
                        Api.* helpers, guarded by lib/session.ts's requireAccess()
  login/                Public login page
components/
  auth/                Login form
  layout/              App sidebar, topbar, user menu (RBAC-filtered nav)
  shared/              Reusable PageHeader, StatusBadge, KpiCard, FilterBar,
                        ConfirmDialog, FormModal
  ui/                  Shadcn primitives
lib/
  services/            trip.service.ts, maintenance.service.ts — the only place
                        vehicle/driver status transitions happen
  rbac.ts              Single source of truth for the RBAC access matrix
  session.ts           JWT session cookies, requireAuth()/requireAccess()
  auth.ts              Password hashing
  analytics.ts         Fuel efficiency, operational cost, ROI, fleet utilization
  api.ts, prisma.ts, logger.ts, meilisearch.ts, errors.ts
prisma/                schema.prisma (no migrations — db push workflow)
scripts/               seed-transitops.js, wipe-db.js, wipe-table.js
store/                 Zustand slices (one per feature domain)
types/                 Zod validation schemas + inferred TypeScript types
```

## Production Notes

- Every API route validates its payload with Zod and never leaks raw Prisma/stack traces to the client (`Api.internalError()` sanitizes).
- Every vehicle/driver status transition goes through `lib/services/*` — never set `.status` directly in a route handler.
- Keep Meilisearch and Loki network access private in deployed environments.
- Rotate `SESSION_SECRET` and the database password before exposing the stack beyond local development.
- `prisma/schema.prisma` is intentionally migration-free (`db push` only) for fast schema iteration — introduce real migrations before production use.

Made by Team Businessmen
