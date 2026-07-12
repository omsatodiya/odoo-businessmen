# TransitOps — Next 2–3 Hours

> Foundation is done and pushed to `origin/main` (steps 1–10: schema, auth,
> RBAC, app shell, seed data — see `plan.md` for the full history). This
> document is what changes **right now**: corrected file paths/signatures
> (a few things drifted from `plan.md` during the build), and exactly what
> each person does for this block. `plan.md` §0/§2/§9/§10 (ownership rules,
> schema, QA checklist, demo script) are still accurate — keep using them.
> `design.md` is the visual spec every page must follow — read it once.

---

## 0. First — pull and sync (everyone, 2 minutes)

```
git pull
pnpm install
npx prisma db push && pnpm db:generate
pnpm db:seed
```

Log in at `/login` with any of these (shared password `Password123!`):

| Role | Email |
|---|---|
| Fleet Manager | fleet.manager@transitops.in |
| Dispatcher | raven.k@transitops.in |
| Safety Officer | safety.officer@transitops.in |
| Financial Analyst | finance.analyst@transitops.in |

---

## 1. Corrections vs. `plan.md` — read before you scaffold anything

A few things were built slightly differently than `plan.md` originally
sketched. Use **these** as the real contract:

- **RBAC has 7 resources, not 5.** `lib/rbac.ts` exports
  `Resource = 'FLEET' | 'DRIVERS' | 'TRIPS' | 'FUEL_EXPENSES' | 'ANALYTICS' | 'SETTINGS' | 'DASHBOARD'`
  and `can(role, resource, 'VIEW' | 'FULL')`. `FLEET` still covers both
  Vehicle Registry and Maintenance.
- **Route guard has no `req` argument.** It reads the session cookie itself:
  ```ts
  import { requireAccess, AuthError } from "@/lib/session";
  import { Api } from "@/lib/api";

  export async function POST(req: NextRequest) {
    try {
      const session = await requireAccess("FLEET", "FULL"); // throws AuthError
      // ...your logic, session.sub / session.role available...
    } catch (error) {
      if (error instanceof AuthError) {
        return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
      }
      logger.error("...", error);
      return Api.internalError();
    }
  }
  ```
  Copy this exact try/catch shape into every route you write.
- **The app shell already exists and is wired.** `app/(app)/layout.tsx`
  handles the auth guard, sidebar, and topbar. You only ever add
  `app/(app)/<route>/page.tsx` — you get auth + nav + RBAC-filtered sidebar
  for free. **Do not touch** `app/(app)/layout.tsx`,
  `components/layout/*`, `lib/rbac.ts`, or `lib/session.ts`.
- **The sidebar already hardcodes these exact routes** (in
  `components/layout/app-sidebar.tsx`) — your page **must** live at this
  exact path or the nav link 404s:
  `/dashboard` `/fleet` `/drivers` `/trips` `/maintenance` `/fuel-expenses` `/analytics` `/settings`
- **`components/ui/data-table.tsx` already exists** — a working generic
  `<DataTable columns data isLoading emptyMessage getRowKey />`. Don't build
  a new one; import this one.
- **Naming:** kebab-case files, e.g. `vehicle-slice.ts` not `vehicle.slice.ts`,
  `store/index.ts` is the barrel — add your slice's export there.
- **Seeding:** the seed script is `scripts/seed-transitops.js` /
  `pnpm db:seed` (not `seed-users.js`). Don't create ad-hoc test users —
  add fixtures to the seed script if you need more data, and ping the Leader.

---

## 2. Outstanding foundation gap (Leader, do this first — ~20 min)

`plan.md` §6 calls for shared components so all three of you render tables,
badges, and modals identically. **These don't exist yet** — build them now,
exactly to the `design.md` §5 spec, before Dev A/B/Newbie need them:

```
components/shared/page-header.tsx
components/shared/status-badge.tsx   (uses design.md §3 color map)
components/shared/kpi-card.tsx
components/shared/filter-bar.tsx
components/shared/confirm-dialog.tsx (thin wrapper over AlertDialog)
components/shared/form-modal.tsx     (thin wrapper over Dialog, design.md §5 structure)
```

Also start `lib/services/trip.service.ts`, `lib/services/maintenance.service.ts`,
and `lib/analytics.ts` per `plan.md` §4 — Dev B's dispatch/complete/cancel and
Dev A's maintenance open/close call directly into these, so they're the
critical path. Ship them within the first block; everyone else works on
Zod types + API scaffolding + Zustand slices in the meantime, which don't
depend on either of these.

---

## 3. Per-person plan for this block

### 🔧 Dev A — Fleet (Screen 2) + Maintenance (Screen 5)

**Block 1 (start now, no blockers):**
```
types/vehicle.ts                    (Zod: regNo, name, type, capacityKg, acquisitionCost, status)
app/api/vehicles/route.ts           (GET list+filter, POST create — requireAccess("FLEET","FULL") for POST, "VIEW" for GET)
app/api/vehicles/[id]/route.ts      (PATCH update/retire)
store/vehicle-slice.ts
app/(app)/fleet/page.tsx
components/fleet/vehicle-form-modal.tsx
```
- Catch Prisma `P2002` on `regNo` → `Api.conflict("Registration number already exists")`.
- Table: Reg No, Name/Model, Type, Capacity, Odometer, Acq. Cost, Status. Odometer/Capacity/Cost columns get `font-mono tabular-nums` per `design.md` §4.
- Once `components/shared/*` lands, swap in `<PageHeader>`, `<StatusBadge>`, `<FormModal>`.

**Block 2 (once `lib/services/maintenance.service.ts` lands, ~20–30 min in):**
```
app/api/maintenance/route.ts           (POST → openMaintenance())
app/api/maintenance/[id]/close/route.ts (POST → closeMaintenance())
store/maintenance-slice.ts
app/(app)/maintenance/page.tsx
components/maintenance/*
```
Call `openMaintenance`/`closeMaintenance` — never set `vehicle.status` yourself.

**Block 3:** verify against `design.md` §9 checklist; confirm with Dev B that an
In-Shop/Retired vehicle correctly disappears from the Trip dispatch dropdown.

---

### 🚚 Dev B — Trips (Screen 4) + Analytics (Screen 7)

**Block 1 (start now — the options query needs no service layer):**
```
types/trip.ts
app/api/trips/options/route.ts   (GET — vehicles where status=AVAILABLE, drivers where status=AVAILABLE AND licenseExpiry > now)
app/api/trips/route.ts           (GET list, POST create as DRAFT — validate cargoWeightKg <= vehicle.capacityKg yourself for now)
store/trip-slice.ts
app/(app)/trips/page.tsx         (lifecycle stepper + create-trip form, wire options endpoint)
```
- Capacity-exceeded warning: `border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive` block (per `design.md` §8), disable Dispatch button when it's showing.

**Block 2 (once `lib/services/trip.service.ts` lands):**
```
app/api/trips/[id]/dispatch/route.ts
app/api/trips/[id]/complete/route.ts
app/api/trips/[id]/cancel/route.ts
components/trips/live-board.tsx
components/trips/complete-trip-dialog.tsx
```
Re-point your Block-1 `POST /api/trips` capacity check to call the service's
validation if it duplicates logic — service is the source of truth once it exists.

**Block 3 (once `lib/analytics.ts` lands):**
```
app/api/analytics/route.ts
app/api/analytics/export/route.ts   (CSV stream)
store/analytics-slice.ts
app/(app)/analytics/page.tsx        (4 KpiCards + monthly revenue bar chart + top-costliest bars)
```

---

### 🌱 Newbie — Drivers (Screen 3) + Fuel & Expenses (Screen 6)

No blockers on either page — full green light to start immediately.

**Block 1:**
```
types/driver.ts
app/api/drivers/route.ts        (GET list, POST create)
app/api/drivers/[id]/route.ts   (PATCH update/status toggle)
store/driver-slice.ts
app/(app)/drivers/page.tsx
components/drivers/driver-form-modal.tsx
```
- Status toggle buttons: Available / Off Duty / Suspended are yours to set
  manually — **disable the "On Trip" toggle entirely**, only the trip service
  sets that.
- `licenseNo` unique → Prisma `P2002` → `Api.conflict(...)`.
- Expired license row: `text-destructive` on the expiry date cell.

**Block 2:**
```
types/fuel.ts, types/expense.ts
app/api/fuel-logs/route.ts
app/api/expenses/route.ts
store/fuel-expense-slice.ts
app/(app)/fuel-expenses/page.tsx
components/fuel/log-fuel-modal.tsx
components/fuel/add-expense-modal.tsx
```
- "Total Operational Cost" footer = server-computed sum of fuel + maintenance
  cost, returned in the GET response — don't compute it client-side from
  partial/paginated data.

**Block 3:** polish against `design.md` §9 checklist. Ping the Leader (not
Dev A/B) if you're blocked on a rule you're unsure about — don't guess on
status transitions.

---

## 4. End-of-block sync

Before starting the next block, do a quick check-in:
- Does every sidebar link (`/fleet /drivers /trips /maintenance /fuel-expenses`)
  render *something* (even a half-built page) instead of 404ing?
- Any schema field someone needed that isn't in `prisma/schema.prisma` yet?
  Leader adds it once, pushes, everyone re-runs `npx prisma db push && pnpm db:generate`.
- Spot-check one page against `design.md` §9 before everyone piles on more
  screens with the same visual gap repeated four times.
