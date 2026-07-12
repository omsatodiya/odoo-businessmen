# TransitOps

**Smart Transport Operations Platform** — a centralized system of record for vehicle, driver, dispatch, maintenance, and expense operations at a transport company.

It replaces the spreadsheets and paper logbooks many transport companies still run on: every vehicle and driver has exactly one true status, every dispatch is validated against real business rules on the server (not just the UI), and every role sees only the slice of the operation it is responsible for.

## Screenshots

<img width="1917" height="927" alt="TransitOps dashboard" src="https://github.com/user-attachments/assets/57f9c0f1-32b7-4b3b-9d8f-fc962ed59ba6" />
<img width="1916" height="926" alt="TransitOps fleet view" src="https://github.com/user-attachments/assets/762838c4-60e8-4016-9145-0ae27a3b9550" />
<img width="1460" height="832" alt="TransitOps trips view" src="https://github.com/user-attachments/assets/bd86a0cf-4222-4e2b-8d21-6efeee7f30c6" />
<img width="1917" height="931" alt="TransitOps analytics view" src="https://github.com/user-attachments/assets/80009cc7-1b63-4557-bb49-67424d2cda95" />

## Core Features

- **Vehicle Registry** — master list of vehicles (reg no, type, capacity, odometer, acquisition cost, region, status).
- **Driver Management** — driver profiles with license category/expiry, safety score, contact, and status.
- **Trip Dispatcher** — create (`DRAFT`), dispatch, complete, and cancel trips. Capacity, availability, and license-expiry guards are enforced inside `lib/services/trip.service.ts`, not just in the form.
- **Maintenance** — opening a maintenance record automatically pulls a vehicle out of the dispatch pool (`IN_SHOP`); closing it returns the vehicle to `AVAILABLE` unless it has been retired.
- **Fuel & Expenses** — fuel logs and other expense records (toll, parking, misc.), rolled up into per-vehicle operational cost.
- **Analytics** — fuel efficiency (km/L), fleet utilization, operational cost, and vehicle ROI, with a monthly revenue chart, a top-costliest-vehicles breakdown, CSV export, and a dedicated print-to-PDF view.
- **Dashboard** — fleet-wide KPIs (active/available/in-maintenance vehicles, active/pending trips, drivers on duty, fleet utilization %), a vehicle status distribution, and a recent-trips table — filterable by vehicle type, status, and region.
- **Notifications** — computed live (not a stored table) from current Trip/Driver/Vehicle/MaintenanceLog state: expiring/expired licenses, vehicles in shop, trips in progress/completed, and route deviations (actual odometer distance >20% over the planned distance on a completed trip).
- **Settings & RBAC** — depot configuration plus an **editable** RBAC matrix: a Fleet Manager can set each role's access (`NONE` / `VIEW` / `FULL`) per resource, with a server-side guard that makes it structurally impossible to lock Fleet Managers out of Settings.
- **Command Palette (Ctrl+K / ⌘K)** — app-wide fuzzy search and navigation across pages, vehicles, drivers, and trips, filtered to what the current role can actually access.
- **License-Expiry Email Reminders** — a cron-triggered scan (`app/api/cron/reminders/route.ts`) that emails drivers whose license expires in exactly 3 or 7 days; also triggerable manually from the Drivers page.
- **Light & Dark Mode** — theme toggle in the top bar via `next-themes`.

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server-rendered pages + REST-style route handlers in one app |
| Language | TypeScript (strict mode) | End-to-end type safety |
| Styling | Tailwind CSS v4 | Utility CSS on top of a custom token set (`app/globals.css`) |
| UI Components | shadcn/ui | Accessible primitives (dialog, table, dropdown, select, etc.) |
| Icons | Lucide React | Iconography |
| Animation | Framer Motion | Page and micro-transitions |
| Charts | Recharts | Analytics bar chart |
| Database | PostgreSQL 15 | Relational storage |
| ORM | Prisma 6 | Schema, migrations-free `db push` workflow, typed client |
| Auth | `jose` (JWT) + `bcryptjs` | Custom session cookie + password hashing — no NextAuth/Auth.js |
| State | Zustand | One store slice per feature domain |
| Validation | Zod | API payload and form validation |
| Search | Meilisearch | Typo-tolerant search, with a Postgres `ILIKE` fallback if offline |
| Logging | Loki (via `lib/logger.ts`) | Structured JSON logs, fail-silent if unreachable |
| Package Manager | pnpm | — |

## Getting Started

**Prerequisites:** Node.js 20+, pnpm, Docker (for Postgres/Meilisearch/Loki).

```bash
pnpm install

# Start Postgres, Meilisearch, and Loki
docker compose up -d

# Copy and adjust environment variables
cp .env.example .env

# Push the Prisma schema (no migration files, by design) and generate the client
npx prisma db push
pnpm db:generate

# Seed demo data: 4 users, 6 vehicles, 5 drivers, 5 trips, maintenance/fuel/expense records
pnpm db:seed

pnpm dev
```

Open `http://localhost:3000` — you'll be redirected to `/login`.

### Environment variables

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/odoo_db?schema=public"
SESSION_SECRET="replace-with-a-long-random-string-openssl-rand-base64-32"
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="masterKey"
MEILISEARCH_USERS_INDEX="users"
LOKI_PUSH_URL="http://localhost:3100/loki/api/v1/push"
LOG_LEVEL="info"
```

`SESSION_SECRET` signs the login session JWT — generate a real one (`openssl rand -base64 32`) outside local development.

### Demo Accounts

Shared password for all: **`Password123!`** (also printed by `pnpm db:seed`).

| Role | Email | Name |
|---|---|---|
| Fleet Manager | `fleet.manager@transitops.in` | Priya Fleet |
| Dispatcher | `raven.k@transitops.in` | Raven K. |
| Safety Officer | `safety.officer@transitops.in` | Aisha Safety |
| Financial Analyst | `finance.analyst@transitops.in` | Karan Finance |

## Architecture

```mermaid
flowchart TD
    Client[Browser - React 19, Zustand, shadcn/ui]
    Pages[Next.js App Router pages]
    Routes[API route handlers]
    Session[lib/session.ts - requireAccess]
    Rbac[lib/rbac.ts - RBAC matrix]
    Services[lib/services - trip and maintenance]
    Analytics[lib/analytics.ts]
    Mailer[lib/services/mailer.service.ts]
    Cron[Cron trigger - api/cron/reminders]
    DB[(PostgreSQL via Prisma 6)]
    Search[(Meilisearch)]
    Logs[(Loki)]
    Disk[(tmp/sent-emails HTML files)]

    Client --> Pages
    Client --> Routes
    Routes --> Session
    Session --> Rbac
    Routes --> Services
    Services --> DB
    Routes --> Analytics
    Analytics --> DB
    Routes --> Search
    Routes --> Logs
    Cron --> Mailer
    Mailer --> Disk
    Cron --> DB
```

### Architecture Notes

- **No separate backend.** Next.js route handlers under `app/api/` are the entire API surface; there is no external server process besides Postgres/Meilisearch/Loki.
- **Single enforcement point for permissions.** Every route calls `requireAccess(resource, need)` (`lib/session.ts:113`), which resolves the session from a JWT cookie and checks it against the RBAC matrix from `lib/rbac.ts`. There is no client-only gate — the sidebar/nav simply hides links the role can't use.
- **RBAC matrix is data, not code.** The matrix lives on `AppSettings.rbacMatrix` (JSON), seeded from `DEFAULT_RBAC_MATRIX`, cached per server process, and editable from Settings by a Fleet Manager for 5 of the 7 resources — `SETTINGS` and `DASHBOARD` access are intentionally hard-coded and never exposed to the editor, so a role can never lock itself out.
- **Status transitions live in one place.** `lib/services/trip.service.ts` and `lib/services/maintenance.service.ts` are the only code paths allowed to change a `Vehicle.status` or `Driver.status` — always inside a `prisma.$transaction`, so a vehicle/driver's status and its owning trip/maintenance record can never drift out of sync.
- **Notifications are computed, not stored.** There is no `Notification` table — `app/api/notifications/route.ts` derives every item on each request from current Trip/Driver/Vehicle/MaintenanceLog rows. Per-browser read/unread state is kept in `localStorage` (`lib/notification-read-state.ts`), since a notification's "resolution" is really just the underlying condition going away.
- **Email is a local dev fallback.** `lib/services/mailer.service.ts` does not call a real SMTP/email provider — it logs the send and writes a styled HTML file to `tmp/sent-emails/` so the email content can still be inspected during development/demos.
- **No migration history.** `prisma/schema.prisma` is evolved with `db push` only, deliberately, for fast iteration — there is no `prisma/migrations` folder.

## Site Map

| Route | Page | Minimum access |
|---|---|---|
| `/login` | Login | Public |
| `/dashboard` | Fleet-wide KPIs, recent trips | `DASHBOARD` — view (all roles) |
| `/fleet` | Vehicle registry | `FLEET` — view/full by role |
| `/drivers` | Driver management | `DRIVERS` — view/full by role |
| `/trips` | Trip dispatcher | `TRIPS` — view/full by role |
| `/maintenance` | Maintenance logs | `FLEET` — view/full by role |
| `/fuel-expenses` | Fuel logs & expenses | `FUEL_EXPENSES` — view/full by role |
| `/analytics` | Reports & analytics | `ANALYTICS` — view/full by role |
| `/analytics-print` | Print-optimized analytics report | Same as `/analytics` |
| `/fuel-expenses-print` | Print-optimized expense report | Same as `/fuel-expenses` |
| `/notifications` | Full notifications list | `DASHBOARD` — view (all roles) |
| `/settings` | Depot config + RBAC editor | `SETTINGS` — view/full by role |

Sidebar links (`components/layout/app-sidebar.tsx`) are filtered live against the signed-in role's resolved permissions — a role never sees a link it has `NONE` access to.

## Role Model

Four roles, one login, each scoped to a different slice of the app (`FLEET_MANAGER`, `DISPATCHER`, `SAFETY_OFFICER`, `FINANCIAL_ANALYST` — the default matrix in `lib/rbac.ts`; editable from Settings):

| Resource | Fleet Manager | Dispatcher | Safety Officer | Financial Analyst |
|---|---|---|---|---|
| Fleet | Full | View | None | View |
| Drivers | Full | None | Full | None |
| Trips | None | Full | View | None |
| Fuel & Expenses | None | None | None | Full |
| Analytics | Full | None | None | Full |
| Settings | Full (fixed) | View (fixed) | View (fixed) | View (fixed) |
| Dashboard | Full (fixed) | Full (fixed) | Full (fixed) | Full (fixed) |

## Domain Model

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string password
        string name
        Role role
        int failedLoginAttempts
        datetime lockedUntil
    }
    Vehicle {
        string id PK
        string regNo UK
        string name
        VehicleType type
        int capacityKg
        int odometer
        decimal acquisitionCost
        VehicleStatus status
        string region
    }
    Driver {
        string id PK
        string name
        string email
        string licenseNo UK
        LicenseCategory licenseCategory
        datetime licenseExpiry
        string contact
        int safetyScore
        DriverStatus status
    }
    Trip {
        string id PK
        string code UK
        string source
        string destination
        int cargoWeightKg
        int plannedDistanceKm
        TripStatus status
        int startOdometer
        int endOdometer
        float fuelConsumedL
        decimal revenue
        datetime dispatchedAt
        datetime completedAt
        string cancelledReason
    }
    MaintenanceLog {
        string id PK
        string type
        decimal cost
        string notes
        MaintenanceStatus status
        datetime openedAt
        datetime closedAt
    }
    FuelLog {
        string id PK
        float liters
        decimal cost
        datetime date
    }
    Expense {
        string id PK
        ExpenseType type
        decimal amount
        datetime date
        string note
    }
    AppSettings {
        string id PK
        string depotName
        string currency
        string distanceUnit
        json rbacMatrix
    }

    Vehicle ||--o{ Trip : "dispatched on"
    Driver ||--o{ Trip : "drives"
    Vehicle ||--o{ MaintenanceLog : "undergoes"
    Vehicle ||--o{ FuelLog : "fueled"
    Vehicle ||--o{ Expense : "incurs"
    Trip ||--o{ FuelLog : "may record"
    Trip ||--o{ Expense : "may record"
```

`Notification` is deliberately absent — see Architecture Notes.

## Business Rules

Enforced server-side in `lib/services/*`, never left to the UI alone:

- **Dispatch pool.** Only `AVAILABLE` vehicles and `AVAILABLE` drivers with a non-expired license appear as dispatch options (`trip.service.ts: getDispatchOptions`).
- **Capacity guard.** A trip's cargo weight can never exceed its vehicle's `capacityKg`, both at creation and again at dispatch time.
- **Dispatch guard.** A trip can only move `DRAFT → DISPATCHED` if it is still `DRAFT`, its vehicle is `AVAILABLE`, its driver is `AVAILABLE`, and the driver's license has not expired — checked inside one `$transaction` alongside setting the vehicle/driver to `ON_TRIP` and stamping `startOdometer` from the vehicle's current odometer.
- **Completion guard.** A trip can only move `DISPATCHED → COMPLETED` if `endOdometer >= startOdometer`; completion frees the vehicle and driver back to `AVAILABLE` and updates the vehicle's odometer.
- **Cancellation.** A `DRAFT` or `DISPATCHED` trip can be cancelled with a reason; cancelling a `DISPATCHED` trip also frees its vehicle and driver. `COMPLETED`/`CANCELLED` trips cannot be re-cancelled.
- **Maintenance lifecycle.** Opening a maintenance record on a non-retired vehicle sets it to `IN_SHOP`; closing the record returns it to `AVAILABLE` unless it has since been retired. Deleting an `ACTIVE` log only frees the vehicle if no other `ACTIVE` log remains on it.
- **RBAC lockout guard.** `setRbacMatrix()` refuses to persist any update where `FLEET_MANAGER.SETTINGS !== "FULL"` — a Fleet Manager can edit every other role's access but can never remove their own path back into the editor.
- **Login lockout.** 5 failed password attempts locks an account for 15 minutes (`app/api/auth/login/route.ts`); the same generic "Invalid email or password" is returned whether the email doesn't exist or the password is wrong, to prevent account enumeration.
- **Route deviation.** A completed trip is flagged as a route deviation notification when its actual odometer distance exceeds the planned distance by more than 20%.

## Endpoint Catalog

All routes return JSON via `lib/api.ts`'s `Api.*` helpers and never leak raw Prisma errors. Every route below except `auth/*`, `health`, and `cron/reminders` is guarded by `requireAccess(resource, need)`.

**Auth**
| Method | Route | Notes |
|---|---|---|
| POST | `/api/auth/login` | Verifies credentials, applies lockout, sets session cookie |
| POST | `/api/auth/logout` | Clears session cookie |
| GET | `/api/auth/me` | Current session's user/role |

**Dashboard & Notifications**
| Method | Route | Notes |
|---|---|---|
| GET | `/api/dashboard` | KPIs, vehicle status distribution, recent trips — filterable by `type`/`status`/`region` |
| GET | `/api/notifications` | Live-derived notification list |

**Fleet**
| Method | Route | Notes |
|---|---|---|
| GET, POST | `/api/vehicles` | List / create |
| PATCH | `/api/vehicles/[id]` | Update |

**Drivers**
| Method | Route | Notes |
|---|---|---|
| GET, POST | `/api/drivers` | List / create |
| PATCH | `/api/drivers/[id]` | Update |

**Trips**
| Method | Route | Notes |
|---|---|---|
| GET, POST | `/api/trips` | List / create (`DRAFT`) |
| GET | `/api/trips/options` | Dispatch-eligible vehicles/drivers |
| POST | `/api/trips/[id]/dispatch` | `DRAFT → DISPATCHED` |
| POST | `/api/trips/[id]/complete` | `DISPATCHED → COMPLETED` |
| POST | `/api/trips/[id]/cancel` | `→ CANCELLED` |

**Maintenance**
| Method | Route | Notes |
|---|---|---|
| GET, POST | `/api/maintenance` | List / open a log (sets vehicle `IN_SHOP`) |
| DELETE | `/api/maintenance/[id]` | Delete a log |
| POST | `/api/maintenance/[id]/close` | `ACTIVE → COMPLETED` |

**Fuel & Expenses**
| Method | Route | Notes |
|---|---|---|
| GET, POST | `/api/fuel-logs` | List / create |
| GET | `/api/fuel-logs/options` | Form dropdown data |
| GET, POST | `/api/expenses` | List / create |

**Analytics & Settings**
| Method | Route | Notes |
|---|---|---|
| GET | `/api/analytics` | Fuel efficiency, cost, ROI, monthly revenue |
| GET, PATCH | `/api/settings` | Depot config |
| PATCH | `/api/settings/rbac` | Update the editable RBAC matrix |

**Ops**
| Method | Route | Notes |
|---|---|---|
| GET | `/api/health` | Liveness check |
| POST | `/api/cron/reminders` | Scans for 3-/7-day license expiries, sends reminder emails |

## Key Workflows

### Trip lifecycle

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> DISPATCHED
    DRAFT --> CANCELLED
    DISPATCHED --> COMPLETED
    DISPATCHED --> CANCELLED
    COMPLETED --> [*]
    CANCELLED --> [*]
```

- `DRAFT -> DISPATCHED`: `dispatchTrip` — checks vehicle available, driver available, license not expired.
- `DRAFT -> CANCELLED` / `DISPATCHED -> CANCELLED`: `cancelTrip` — cancelling a dispatched trip frees its vehicle and driver.
- `DISPATCHED -> COMPLETED`: `completeTrip` — requires end odometer >= start odometer.

### Dispatch side effects

```mermaid
sequenceDiagram
    participant UI as Trips Page
    participant API as Dispatch Route
    participant Svc as trip.service
    participant DB as PostgreSQL

    UI->>API: POST dispatch
    API->>API: requireAccess TRIPS FULL
    API->>Svc: dispatchTrip
    Svc->>DB: begin transaction
    Svc->>DB: verify trip, vehicle, driver, license
    Svc->>DB: update trip status
    Svc->>DB: update vehicle status
    Svc->>DB: update driver status
    Svc->>DB: commit
    DB-->>API: updated trip
    API-->>UI: 200 OK
```

### Maintenance lifecycle

```mermaid
stateDiagram-v2
    [*] --> ACTIVE
    ACTIVE --> COMPLETED
    COMPLETED --> [*]
```

- `[*] -> ACTIVE`: `openMaintenance` — sets the vehicle to `IN_SHOP` unless it's retired.
- `ACTIVE -> COMPLETED`: `closeMaintenance` — returns the vehicle to `AVAILABLE` unless it's retired.

## Project Structure

```text
app/
  (app)/                RBAC-gated shell: dashboard, fleet, drivers, trips,
                         maintenance, fuel-expenses, analytics, notifications, settings
  api/                   Route handlers — Zod-validated, respond via lib/api.ts,
                          guarded by lib/session.ts's requireAccess()
  login/                 Public login page
components/
  auth/                  Login form
  layout/                Sidebar, topbar, command palette, notifications menu
  shared/                PageHeader, StatusBadge, KpiCard, FilterBar, ConfirmDialog, FormModal
  modals/, tables/        Feature-specific dialogs and data tables
  dashboard/, drivers/, fleet/, fuel/, maintenance/, trips/
  ui/                     shadcn primitives
lib/
  services/               trip.service.ts, maintenance.service.ts — the only place
                          vehicle/driver status transitions happen
  rbac.ts                 RBAC matrix types, defaults, DB-backed get/set
  session.ts              JWT session cookie, requireAuth()/requireAccess()
  auth.ts                 Password hashing (bcrypt)
  analytics.ts             Fuel efficiency, operational cost, ROI, fleet utilization
  notification-read-state.ts   Per-browser read/unread tracking (localStorage)
  api.ts, errors.ts, prisma.ts, logger.ts, meilisearch.ts
prisma/                   schema.prisma (db push workflow, no migrations)
scripts/                  seed-transitops.js, wipe-db.js, wipe-table.js, db-wipe-utils.js
store/                    Zustand slices, one per feature domain
types/                    Zod schemas + inferred TypeScript types
```

## Development Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | `prisma generate` + production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint |
| `npx prisma db push` | Sync `prisma/schema.prisma` to the database |
| `pnpm db:generate` | Regenerate the Prisma Client |
| `pnpm db:seed` | Reset and reseed all demo data — safe to re-run |
| `pnpm db:wipe` | Wipe all database tables (with confirmation) |
| `pnpm db:wipe:table <name>` | Wipe a single table |

## Future Direction

- Real migration history (`prisma migrate`) before any production deployment.
- A real SMTP/email provider behind `lib/services/mailer.service.ts`, replacing the local `tmp/sent-emails/` fallback.
- Multi-instance-safe RBAC matrix caching (currently an in-process module variable — fine for a single instance, not for horizontal scaling).
- Audit logging for RBAC matrix changes and destructive actions (maintenance/trip deletes).

## Security Notes

- Sessions are stateless JWTs (`jose`, HS256) in an `httpOnly`, `sameSite=lax` cookie, signed with `SESSION_SECRET` — rotate this value before any shared/deployed environment.
- Passwords are hashed with bcrypt (`lib/auth.ts`); the login endpoint returns the same generic error for a nonexistent email and a wrong password, and locks an account for 15 minutes after 5 failed attempts.
- Every route handler validates its payload with Zod and returns sanitized errors via `Api.internalError()` — no raw Prisma/stack traces reach the client.
- RBAC is enforced once, centrally, in `requireAccess()` — never re-implemented per route or trusted from the client.
- Keep Meilisearch and Loki off the public network in any deployed environment; both fail silently if unreachable, so this is safe to do without breaking the app.

## License

No license file is included — this is a hackathon/internal project, not currently published under an open-source license.

Made by Team Businessmen
