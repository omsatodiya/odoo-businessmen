# TransitOps — Master Build Plan (8-Hour Hackathon)

> **Read this top-to-bottom once, then jump to your section.** Every teammate
> owns specific files. If you need a field that doesn't exist in the schema,
> **ask the Team Leader** — do not edit `schema.prisma` yourself.

---

## 0. Team & Ownership

| Person | Role | Owns |
|---|---|---|
| **You (Leader)** | Architect / Gatekeeper | Foundation, schema, auth + RBAC, service layer, Dashboard, Settings, QA |
| **Dev A** (strong) | Fleet domain | Vehicle Registry + Maintenance (UI + API) |
| **Dev B** (strong) | Operations domain | Trip Dispatcher + Analytics (UI + API) |
| **Newbie** (guided) | Records domain | Driver Management + Fuel & Expenses (UI + API) |

**Golden rules**
1. **Only the Leader edits `prisma/schema.prisma`.** Field requests go through chat.
2. Stay inside **your files** (listed per section). Shared files freeze after Hour 1.
3. **All status transitions go through `lib/services/*`** — never flip a vehicle/driver status directly in a route.
4. Every API route: `Zod validate → try/catch → Api.*()` helper. Never leak Prisma errors.
5. Commit small + often. `rtk git pull` before `rtk git push`. Rebase, don't merge.
6. Newbie's merges get a 2-minute Leader glance first.

---

## 1. Tech Stack (already in boilerplate)

- Next.js 16 App Router, React 19, strict TypeScript
- Tailwind v4 + Shadcn UI
- Zustand (`/store` slices)
- PostgreSQL (Docker) + Prisma 6 — **`npx prisma db push && pnpm db:generate`**, no migrations
- Meilisearch with Postgres `ILIKE` fallback
- JSON logging via `lib/logger.ts`
- Response helper `lib/api.ts` (`Api.ok`, `Api.badRequest`, `Api.unauthorized`, `Api.forbidden`, `Api.conflict`, `Api.notFound`, `Api.internalError`)

---

## 2. Prisma Schema — FINAL (`prisma/schema.prisma`) — Leader only

```prisma
enum Role { FLEET_MANAGER  DISPATCHER  SAFETY_OFFICER  FINANCIAL_ANALYST }

enum VehicleType   { VAN  TRUCK  MINI  BUS  TRAILER }
enum VehicleStatus { AVAILABLE  ON_TRIP  IN_SHOP  RETIRED }

enum LicenseCategory { LMV  HMV  MCWG  TRANS }
enum DriverStatus    { AVAILABLE  ON_TRIP  OFF_DUTY  SUSPENDED }

enum TripStatus        { DRAFT  DISPATCHED  COMPLETED  CANCELLED }
enum MaintenanceStatus { ACTIVE  COMPLETED }          // ACTIVE => vehicle IN_SHOP
enum ExpenseType       { TOLL  MAINTENANCE  FUEL  PARKING  OTHER }

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String                       // bcrypt hash
  name      String
  role      Role
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Vehicle {
  id              String        @id @default(cuid())
  regNo           String        @unique
  name            String
  type            VehicleType
  capacityKg      Int
  odometer        Int           @default(0)
  acquisitionCost Decimal       @db.Decimal(12, 2)
  status          VehicleStatus @default(AVAILABLE)
  region          String?
  trips           Trip[]
  maintenanceLogs MaintenanceLog[]
  fuelLogs        FuelLog[]
  expenses        Expense[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  @@index([status])
  @@index([type])
}

model Driver {
  id              String          @id @default(cuid())
  name            String
  licenseNo       String          @unique
  licenseCategory LicenseCategory
  licenseExpiry   DateTime
  contact         String
  safetyScore     Int             @default(100)   // 0–100
  status          DriverStatus    @default(AVAILABLE)
  trips           Trip[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  @@index([status])
}

model Trip {
  id                String     @id @default(cuid())
  code              String     @unique            // "TR001"
  source            String
  destination       String
  cargoWeightKg     Int
  plannedDistanceKm Int
  vehicleId         String
  driverId          String
  vehicle           Vehicle    @relation(fields: [vehicleId], references: [id])
  driver            Driver     @relation(fields: [driverId], references: [id])
  status            TripStatus @default(DRAFT)
  startOdometer     Int?
  endOdometer       Int?
  fuelConsumedL     Float?
  revenue           Decimal?   @db.Decimal(12, 2)
  dispatchedAt      DateTime?
  completedAt       DateTime?
  cancelledReason   String?
  fuelLogs          FuelLog[]
  expenses          Expense[]
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  @@index([status])
  @@index([vehicleId])
  @@index([driverId])
}

model MaintenanceLog {
  id        String            @id @default(cuid())
  vehicleId String
  vehicle   Vehicle           @relation(fields: [vehicleId], references: [id])
  type      String                                   // "Oil Change"
  cost      Decimal           @db.Decimal(12, 2) @default(0)
  notes     String?
  status    MaintenanceStatus @default(ACTIVE)
  openedAt  DateTime          @default(now())
  closedAt  DateTime?
  @@index([vehicleId])
  @@index([status])
}

model FuelLog {
  id        String   @id @default(cuid())
  vehicleId String
  vehicle   Vehicle  @relation(fields: [vehicleId], references: [id])
  tripId    String?
  trip      Trip?    @relation(fields: [tripId], references: [id])
  liters    Float
  cost      Decimal  @db.Decimal(12, 2)
  date      DateTime @default(now())
  @@index([vehicleId])
}

model Expense {
  id        String      @id @default(cuid())
  vehicleId String
  vehicle   Vehicle     @relation(fields: [vehicleId], references: [id])
  tripId    String?
  trip      Trip?       @relation(fields: [tripId], references: [id])
  type      ExpenseType
  amount    Decimal     @db.Decimal(12, 2)
  date      DateTime    @default(now())
  note      String?
  @@index([vehicleId])
}

model AppSettings {
  id           String @id @default("singleton")     // always one row
  depotName    String @default("Gandhinagar Depot GJ-14")
  currency     String @default("INR")
  distanceUnit String @default("Kilometers")
  updatedAt    DateTime @updatedAt
}
```

---

## 3. RBAC — Single Source of Truth (from Screen 8) — `lib/rbac.ts` — Leader

Access levels: `NONE` (hidden), `VIEW` (read-only), `FULL` (read + write).
Dashboard is visible to everyone. Settings is Fleet-Manager-writable, others read-only.

| Role \ Resource | FLEET | DRIVERS | TRIPS | FUEL_EXPENSES | ANALYTICS |
|---|---|---|---|---|---|
| **FLEET_MANAGER** | FULL | FULL | NONE | NONE | FULL |
| **DISPATCHER** | VIEW | NONE | FULL | NONE | NONE |
| **SAFETY_OFFICER** | NONE | FULL | VIEW | NONE | NONE |
| **FINANCIAL_ANALYST** | VIEW | NONE | NONE | FULL | FULL |

> Note: `FLEET` covers Vehicle Registry **and** Maintenance. Trip's "options"
> read (available vehicles/drivers) is allowed for anyone with TRIPS ≥ VIEW.

```ts
// lib/rbac.ts
export type Resource = 'FLEET' | 'DRIVERS' | 'TRIPS' | 'FUEL_EXPENSES' | 'ANALYTICS' | 'SETTINGS' | 'DASHBOARD';
export type Access = 'NONE' | 'VIEW' | 'FULL';

export const MATRIX: Record<Role, Record<Resource, Access>> = {
  FLEET_MANAGER:    { FLEET:'FULL', DRIVERS:'FULL', TRIPS:'NONE', FUEL_EXPENSES:'NONE', ANALYTICS:'FULL', SETTINGS:'FULL', DASHBOARD:'FULL' },
  DISPATCHER:       { FLEET:'VIEW', DRIVERS:'NONE', TRIPS:'FULL', FUEL_EXPENSES:'NONE', ANALYTICS:'NONE', SETTINGS:'VIEW', DASHBOARD:'FULL' },
  SAFETY_OFFICER:   { FLEET:'NONE', DRIVERS:'FULL', TRIPS:'VIEW', FUEL_EXPENSES:'NONE', ANALYTICS:'NONE', SETTINGS:'VIEW', DASHBOARD:'FULL' },
  FINANCIAL_ANALYST:{ FLEET:'VIEW', DRIVERS:'NONE', TRIPS:'NONE', FUEL_EXPENSES:'FULL', ANALYTICS:'FULL', SETTINGS:'VIEW', DASHBOARD:'FULL' },
};

export const can = (role: Role, res: Resource, need: 'VIEW'|'FULL') => {
  const lvl = MATRIX[role][res];
  return need === 'VIEW' ? lvl !== 'NONE' : lvl === 'FULL';
};
```

**Used in two places:**
- **API:** `requireAccess(req, 'TRIPS', 'FULL')` at the top of every protected route (Leader provides helper).
- **UI:** sidebar hides links where access is `NONE`; write buttons disabled where access is `VIEW`.

---

## 4. Service Layer Contract (`lib/services/`) — Leader writes, everyone calls

All functions run inside `prisma.$transaction`. They throw typed errors
(`BusinessError` with a `code`) that routes translate to `Api.badRequest`/`Api.conflict`.

**`trip.service.ts`**
- `getDispatchOptions()` → `{ vehicles, drivers }` where vehicle.status=`AVAILABLE` and driver.status=`AVAILABLE` AND `licenseExpiry > now`. *(This alone enforces "Retired/In Shop/Suspended/expired never appear".)*
- `createTrip(input)` → validates `cargoWeightKg <= vehicle.capacityKg`, generates `code`, status `DRAFT`.
- `dispatchTrip(id)` → guards: vehicle AVAILABLE, driver AVAILABLE, license not expired, cargo ≤ capacity. On success: trip→`DISPATCHED`, vehicle→`ON_TRIP`, driver→`ON_TRIP`, set `dispatchedAt`, `startOdometer = vehicle.odometer`.
- `completeTrip(id, {endOdometer, fuelConsumedL, revenue?})` → require `endOdometer >= startOdometer`; create `FuelLog`; update `vehicle.odometer`; trip→`COMPLETED`; vehicle & driver→`AVAILABLE`.
- `cancelTrip(id, reason)` → if `DISPATCHED`, restore vehicle & driver to `AVAILABLE`; trip→`CANCELLED`.

**`maintenance.service.ts`**
- `openMaintenance(input)` → block if vehicle is `ON_TRIP` or `RETIRED`; create `ACTIVE` log; vehicle→`IN_SHOP`.
- `closeMaintenance(id)` → log→`COMPLETED`, `closedAt=now`; vehicle→`AVAILABLE` **unless** `RETIRED`.

**`analytics.ts`** (pure functions, no side effects)
- `fuelEfficiency(vehicle)` = Σ actualDistance ÷ Σ fuelLiters (km/L)
- `fleetUtilization()` = onTrip ÷ (total − retired) × 100
- `operationalCost(vehicle)` = Σ fuelCost + Σ maintenanceCost + Σ expenses
- `vehicleRoi(vehicle)` = (Σ revenue − (maintenance + fuel)) ÷ acquisitionCost × 100

---

## 5. API Endpoint Map

| Route | Method | Owner | Guard |
|---|---|---|---|
| `/api/auth/login` | POST | Leader | public |
| `/api/auth/logout` | POST | Leader | auth |
| `/api/auth/me` | GET | Leader | auth |
| `/api/vehicles` | GET/POST | Dev A | FLEET view/full |
| `/api/vehicles/[id]` | PATCH | Dev A | FLEET full |
| `/api/maintenance` | GET/POST | Dev A | FLEET full |
| `/api/maintenance/[id]/close` | POST | Dev A | FLEET full |
| `/api/drivers` | GET/POST | Newbie | DRIVERS view/full |
| `/api/drivers/[id]` | PATCH | Newbie | DRIVERS full |
| `/api/trips` | GET/POST | Dev B | TRIPS view/full |
| `/api/trips/options` | GET | Dev B | TRIPS view |
| `/api/trips/[id]/dispatch` | POST | Dev B | TRIPS full |
| `/api/trips/[id]/complete` | POST | Dev B | TRIPS full |
| `/api/trips/[id]/cancel` | POST | Dev B | TRIPS full |
| `/api/fuel-logs` | GET/POST | Newbie | FUEL_EXPENSES view/full |
| `/api/expenses` | GET/POST | Newbie | FUEL_EXPENSES view/full |
| `/api/dashboard/kpis` | GET | Leader | DASHBOARD view |
| `/api/analytics` | GET | Dev B | ANALYTICS view |
| `/api/analytics/export` | GET | Dev B | ANALYTICS view |
| `/api/settings` | GET/PATCH | Leader | SETTINGS view/full |

---

## 6. Shared Component & Store Conventions (build once, Hour 1)

**Shared components** (`components/shared/`, Leader seeds them):
- `<PageHeader title actions/>`, `<DataTable/>`, `<StatusBadge status/>` (color map for all enums), `<KpiCard label value accent/>`, `<FilterBar/>`, `<ConfirmDialog/>`, `<FormModal/>`.

**Store slice shape** (copy this exact pattern for every slice):
```ts
interface Slice<T> {
  items: T[]; loading: boolean; error?: string;
  filters: Record<string, string>;
  fetch(): Promise<void>;
  create(dto): Promise<void>;
  update(id, dto): Promise<void>;
  setFilter(k, v): void;
}
```

**Status → color** (use everywhere for consistency):
- Vehicle: AVAILABLE=green, ON_TRIP=blue, IN_SHOP=orange, RETIRED=red
- Driver: AVAILABLE=green, ON_TRIP=blue, OFF_DUTY=gray, SUSPENDED=orange
- Trip: DRAFT=gray, DISPATCHED=blue, COMPLETED=green, CANCELLED=red

---

# 7. PER-TEAMMATE WORK PACKAGES

Each package below is self-contained — paste your whole section into your AI IDE.

---

## 👑 LEADER (You) — Foundation, Auth/RBAC, Services, Dashboard, Settings, QA

### Phase 1 (Hour 0–1) — unblock everyone
**Files:** `prisma/schema.prisma`, `lib/prisma.ts`, `lib/api.ts`, `lib/logger.ts`,
`lib/auth.ts` (bcrypt + JWT session cookie), `lib/session.ts` (`getSession`, `requireAuth`, `requireAccess`),
`lib/rbac.ts`, `store/ui.slice.ts` (theme + toasts), `components/layout/sidebar.tsx` + `topbar.tsx`,
`components/shared/*`, `app/(app)/layout.tsx` (auth guard + RBAC-filtered nav),
`app/(auth)/login/page.tsx`, `scripts/seed-users.js`.

- `db push` + `db:generate`, commit schema **first thing**.
- Seed: 4 users (one per role, e.g. `dispatcher@transitops.in` / `Password123`), ~6 vehicles, ~5 drivers, a couple of completed trips + fuel logs so Dashboard/Analytics aren't empty.
- Ship the **reference module** (login → dashboard renders) so others copy the pattern.
- **Deliver `requireAccess(req, resource, level)` helper** — Dev A/B/Newbie depend on it.

### Phase 2 (Hour 1–3) — service layer
- `lib/services/trip.service.ts`, `lib/services/maintenance.service.ts`, `lib/analytics.ts` (§4).
- Unit-sanity each with a quick script in `scripts/`.

### Phase 3 (Hour 3–5) — Dashboard (Screen 1)
**Files:** `app/(app)/dashboard/page.tsx`, `store/dashboard.slice.ts`, `app/api/dashboard/kpis/route.ts`.
- KPI cards: Active Vehicles, Available, In Maintenance, Active Trips, Pending Trips, Drivers On Duty, Fleet Utilization %.
- Recent Trips table + Vehicle Status horizontal bars (available/on-trip/in-shop/retired counts).
- Filters: vehicle type, status, region.

### Phase 4 (Hour 5–6) — Settings (Screen 8)
**Files:** `app/(app)/settings/page.tsx`, `store/settings.slice.ts`, `app/api/settings/route.ts`.
- General form: Depot Name, Currency, Distance Unit → `AppSettings` singleton.
- **RBAC matrix table** rendered read-only from `lib/rbac.ts` MATRIX (✓ = FULL, "view" = VIEW, "—" = NONE). Save button only enabled for FLEET_MANAGER.

### Phase 5 (Hour 6.5–8) — QA & demo
- Run the **§9 business-rule checklist** end-to-end. Fix transition bugs first.
- Drive the **§10 demo script**. Feature freeze at 7:30.

**Acceptance:** login+RBAC works, every service transition verified, dashboard KPIs live, settings persists.

---

## 🔧 DEV A — Vehicle Registry (Screen 2) + Maintenance (Screen 5)

### Files you own
```
app/(app)/fleet/page.tsx
app/(app)/maintenance/page.tsx
app/api/vehicles/route.ts
app/api/vehicles/[id]/route.ts
app/api/maintenance/route.ts
app/api/maintenance/[id]/close/route.ts
store/vehicle.slice.ts
store/maintenance.slice.ts
components/fleet/*      (VehicleFormModal, etc.)
components/maintenance/*
types/vehicle.ts, types/maintenance.ts   (Zod)
```

### Vehicle Registry tasks
- Table cols: Reg No (unique), Name/Model, Type, Capacity, Odometer, Acq. Cost, Status badge.
- Filters: Type, Status, free-text `q` (search reg no / name — use `search.ts`).
- **+ Add Vehicle** modal → `POST /api/vehicles`. Edit via `PATCH`. "Retire" action sets status `RETIRED`.
- **Unique regNo:** catch Prisma `P2002` → return `Api.conflict('Registration number already exists')`; show inline toast.
- Zod: `regNo` non-empty, `capacityKg` int > 0, `acquisitionCost` positive, `type` enum, `status` enum.

### Maintenance tasks (call Leader's `maintenance.service.ts` — do NOT flip status yourself)
- Left form: Vehicle (dropdown of non-retired vehicles), Service Type, Cost, Date, Status.
- **Save** → `POST /api/maintenance` → `openMaintenance()` → vehicle auto-becomes `IN_SHOP`.
- Right "Service Log" table: Vehicle, Service, Cost, Status badge.
- Each ACTIVE row gets a **Close/Complete** action → `POST /api/maintenance/[id]/close` → vehicle back to `AVAILABLE`.
- Render the two transition arrows + note ("In Shop vehicles are removed from the dispatch pool") as static helper text.

**Acceptance:** duplicate regNo blocked cleanly; opening maintenance hides the vehicle from the Trip dispatch dropdown; closing restores it.

**AI IDE prompt seed:** *"Build a Next.js App Router page + Zustand slice + Zod-validated API routes for a Vehicle Registry with unique regNo (handle P2002 as 409). Use the shared `<DataTable>`, `<StatusBadge>`, `<FormModal>` components. Maintenance page must call `openMaintenance`/`closeMaintenance` from `lib/services/maintenance.service.ts` and never mutate vehicle.status directly."*

---

## 🚚 DEV B — Trip Dispatcher (Screen 4) + Analytics (Screen 7)

### Files you own
```
app/(app)/trips/page.tsx
app/(app)/analytics/page.tsx
app/api/trips/route.ts
app/api/trips/options/route.ts
app/api/trips/[id]/dispatch/route.ts
app/api/trips/[id]/complete/route.ts
app/api/trips/[id]/cancel/route.ts
app/api/analytics/route.ts
app/api/analytics/export/route.ts
store/trip.slice.ts
store/analytics.slice.ts
components/trips/*    (CreateTripForm, LiveBoard, CompleteTripDialog)
components/analytics/*
types/trip.ts        (Zod)
```

### Trip Dispatcher tasks (all writes via `trip.service.ts`)
- **Lifecycle stepper**: Draft → Dispatched → Completed → Cancelled (visual).
- **Create Trip form**: Source, Destination, Vehicle (from `/api/trips/options`), Driver (from options), Cargo Weight, Planned Distance.
- **Live capacity check**: when cargo > vehicle capacity, show the red warning box + **disable Dispatch** (matches wireframe: "Capacity exceeded by X kg — dispatch blocked").
- **Dispatch** → `POST /dispatch`; **Complete** opens a dialog for final odometer + fuel (+ optional revenue) → `POST /complete`; **Cancel** → `POST /cancel` with reason.
- **Live Board** (right): cards per trip with vehicle/driver, status badge, ETA/note.
- Dropdowns MUST come from `/api/trips/options` so retired/in-shop/on-trip/suspended/expired never show.

### Analytics tasks (read-only aggregation via `lib/analytics.ts`)
- Four KPI cards: Fuel Efficiency (km/L), Fleet Utilization %, Operational Cost, Vehicle ROI % (show the ROI formula caption).
- **Monthly Revenue** bar chart (sum trip.revenue by month of completedAt).
- **Top Costliest Vehicles** horizontal bars (by operationalCost, top 3–5).
- **CSV export** button → `/api/analytics/export` streams `text/csv` (per-vehicle: regNo, distance, fuel, efficiency, opCost, revenue, ROI).
- Charts: use a lightweight lib or pure CSS/SVG bars — keep it dependency-light.

**Acceptance:** capacity guard blocks dispatch in UI *and* API; dispatch/complete/cancel produce correct status flips; CSV downloads with real numbers.

**AI IDE prompt seed:** *"Build the Trip Dispatcher: a create-trip form whose vehicle/driver options come from `GET /api/trips/options`, with a live cargo>capacity guard that disables Dispatch. Wire Dispatch/Complete/Cancel to `POST /api/trips/[id]/{dispatch,complete,cancel}` which call functions in `lib/services/trip.service.ts`. Then build an Analytics page reading `GET /api/analytics` with 4 KPI cards, a monthly-revenue bar chart, a top-costliest-vehicles bar list, and a CSV export."*

---

## 🌱 NEWBIE — Driver Management (Screen 3) + Fuel & Expenses (Screen 6)

> These are the cleanest modules — mostly CRUD + tables. Copy the Leader's
> reference module structure closely. Ping the Leader when stuck; don't guess on
> status rules.

### Files you own
```
app/(app)/drivers/page.tsx
app/(app)/fuel-expenses/page.tsx
app/api/drivers/route.ts
app/api/drivers/[id]/route.ts
app/api/fuel-logs/route.ts
app/api/expenses/route.ts
store/driver.slice.ts
store/fuelExpense.slice.ts
components/drivers/*      (DriverFormModal)
components/fuel/*         (LogFuelModal, AddExpenseModal)
types/driver.ts, types/fuel.ts, types/expense.ts   (Zod)
```

### Driver Management tasks
- Table cols: Driver, License No, Category, Expiry, Contact, Trip Completion %, Safety badge, Status badge.
- **+ Add Driver** modal → `POST /api/drivers`. Edit → `PATCH`.
- Status toggle buttons: Available / On Trip / Off Duty / Suspended.
  - **Rule:** you may set Available / Off Duty / Suspended manually, but **never set `ON_TRIP` manually** (only the trip service does that). Disable that button.
- Show the note: *"Expired license or Suspended status → blocked from trip assignment."* (The trip service enforces it; you just display drivers.)
- Highlight expired licenses in red (compare `licenseExpiry` to today).
- Zod: `licenseNo` unique (handle P2002 → 409), `contact` string, `licenseExpiry` date, `safetyScore` 0–100.

### Fuel & Expenses tasks
- **Fuel Logs** table: Vehicle, Date, Liters, Fuel Cost. **+ Log Fuel** modal → `POST /api/fuel-logs` (vehicle, liters, cost, date, optional trip).
- **Other Expenses** table: Trip, Vehicle, Toll, Other, Maint (linked), Total. **+ Add Expense** modal → `POST /api/expenses` (type = TOLL/OTHER/… , amount, vehicle, optional trip).
- **Total Operational Cost (auto)** footer = Σ fuel cost + Σ maintenance cost across shown data. Compute on the server in the GET response and display.

**Acceptance:** can add a driver, toggle allowed statuses, add a fuel log and an expense, and the operational-cost total updates.

**AI IDE prompt seed:** *"Build a Drivers CRUD page (Next.js App Router + Zustand + Zod) with status-toggle buttons where the ON_TRIP button is disabled, unique licenseNo returning 409 on conflict, and expired licenses shown in red. Then build a Fuel & Expenses page with a Fuel Logs table (+ Log Fuel modal) and an Other Expenses table (+ Add Expense modal), plus a server-computed Total Operational Cost = fuel + maintenance footer. Reuse shared `<DataTable>`, `<StatusBadge>`, `<FormModal>`."*

---

## 8. Hour-by-Hour Timeline

| Hour | Leader | Dev A | Dev B | Newbie |
|---|---|---|---|---|
| 0–1 | Foundation, auth, RBAC, shared UI, seed | env up, read pattern | env up, read pattern | env up, read pattern |
| 1–3 | Service layer + analytics fns | Vehicle Registry | Trip form + options | Driver Management |
| 3–5 | Dashboard | Maintenance | Dispatch/Complete/Cancel + Live Board | Fuel & Expenses |
| 5–6.5 | Settings + review | Search (Meili+ILIKE) on fleet | Analytics + CSV | Dark-mode/empty-state polish |
| 6.5–7.5 | Full QA (§9) | Fix bugs | Fix bugs | Fix bugs |
| 7.5–8 | Freeze + demo drive | Support | Support | Support |

---

## 9. Mandatory Business-Rule QA Checklist (Hour 6.5)

- [ ] Duplicate regNo → clean 409 (no stack trace)
- [ ] Duplicate licenseNo → clean 409
- [ ] Retired & In-Shop vehicles absent from dispatch dropdown
- [ ] Expired-license / Suspended / Off-Duty / On-Trip driver absent from dispatch dropdown
- [ ] On-Trip vehicle or driver can't be double-assigned
- [ ] Cargo > capacity → dispatch blocked in UI **and** API
- [ ] Dispatch → vehicle + driver both `ON_TRIP`, `startOdometer` snapshotted
- [ ] Complete → both `AVAILABLE`, odometer updated, fuel log created
- [ ] Cancel dispatched → both restored to `AVAILABLE`
- [ ] Open maintenance → vehicle `IN_SHOP` + gone from dispatch
- [ ] Close maintenance → `AVAILABLE` (unless `RETIRED`)
- [ ] KPIs + analytics recompute after each action
- [ ] Each role sees only its allowed nav + write buttons (RBAC matrix)

---

## 10. Demo Script (follow the problem statement's example)

1. Login as Fleet Manager → register **Van-05**, capacity 500 kg, Available.
2. Register driver **Alex** with a valid license.
3. Login as Dispatcher → create trip, Cargo 450 kg → validated ≤ 500 → **Dispatch**.
4. Show Van-05 + Alex flip to **On Trip** (Dashboard + registries update live).
5. **Complete** trip: enter final odometer + fuel → both back to **Available**.
6. Try Cargo 700 kg → red "capacity exceeded" → Dispatch disabled.
7. Fleet Manager → open **Oil Change** maintenance on Van-05 → status **In Shop**, disappears from dispatch.
8. Close maintenance → back to Available.
9. Financial Analyst → Analytics shows updated fuel efficiency, operational cost, ROI, monthly revenue → export CSV.

---

## 11. Bonus (only if ahead of schedule)
Dark mode (already in `ui.slice`), charts (Analytics), PDF export, license-expiry email reminders, vehicle document upload, global search. Do **not** start these until §9 passes.
