# TransitOps — UI/UX Design System

> The wireframes define **structure** (what's on each screen). This document
> defines **finish** — how it should actually look and feel. Everyone builds
> against this so four people's work reads as one product, not four different
> apps stitched together.

**Read this once before building your first page.** It's short on purpose —
every rule below maps to a copy-pasteable Tailwind pattern.

---

## 1. Design principles

1. **Dense but calm.** This is an ops tool people stare at all day — pack
   information in, but use spacing/weight/color to keep it scannable, not
   loud. (Already set in `globals.css`: `--radius: 0` → sharp corners
   everywhere. Lean into that "engineered console" feel, don't fight it with
   rounded cards.)
2. **Color is a signal, not decoration.** `primary` (blue) means "this is the
   one thing to click." Status colors mean exactly one status each (§3).
   Everything else stays neutral (`foreground`/`muted-foreground`/`border`).
3. **Two typefaces, two jobs.** `font-sans` (Geist) for every label, heading,
   and button. `font-mono` (JetBrains Mono) for **every number** — odometer,
   currency, percentages, counts, dates in tables. This one rule does more to
   make the product look "engineered" than anything else — use it
   consistently everywhere numbers appear.
4. **Never introduce a new color.** Every hex value already lives in
   `app/globals.css` as a CSS variable. If you need a color, it's `bg-primary`,
   `text-destructive`, `bg-chart-3/15`, etc. — never `bg-orange-500`.

---

## 2. Spacing, radius, elevation

- Spacing scale: stick to Tailwind's default steps at `1`/`1.5`/`2`/`3`/`4`/`6`/`8`
  (i.e. 4/6/8/12/16/24/32px). Card padding = `p-4` (dense) or `p-6` (form
  cards). Section gaps = `gap-6` or `space-y-6`.
- Radius: `--radius` is `0` — **do not** add `rounded-lg`/`rounded-xl` to
  cards, tables, or buttons. Sharp corners are the aesthetic. Exceptions
  already baked into shadcn primitives (avatars, badges use `rounded-full`,
  checkboxes use a small radius) — leave those alone.
- Elevation: no drop shadows for hierarchy. Use `border border-border` +
  `bg-card` vs `bg-background` to separate surfaces. Reserve `shadow-sm` for
  floating elements only (dropdowns, popovers, dialogs — already handled by
  the shadcn primitives).
- Hover state on any clickable row/card: `hover:bg-muted/50 transition-colors`
  — subtle, not a shadow pop.

---

## 3. Color usage rules

### Status color mapping (canonical — use everywhere, no exceptions)

| Status | Token | Example classes |
|---|---|---|
| Available / Completed / Active-good | `chart-2` (green) | `bg-chart-2/15 text-chart-2` |
| On Trip / Dispatched / In progress | `primary` (blue) | `bg-primary/15 text-primary` |
| In Shop / Suspended / Warning | `chart-3` (orange) | `bg-chart-3/15 text-chart-3` |
| Retired / Cancelled / Error | `destructive` (red) | `bg-destructive/10 text-destructive` |
| Draft / Off Duty / Neutral | `muted-foreground` | `bg-muted text-muted-foreground` |

This is the **only** place status colors are defined. If a component needs a
badge, it imports `getStatusColor()` — see §5 `StatusBadge`. Don't hardcode
color classes per-feature; every teammate's table should look identical in
how it colors state.

### Everything else

- Primary actions (Add Vehicle, Dispatch, Sign In, Save): `<Button>` default
  variant (`bg-primary`).
- Destructive actions (Delete, Cancel Trip, Retire): `<Button variant="destructive">`
  or `<AlertDialog>` for anything irreversible.
- Secondary/tertiary actions: `variant="outline"` or `variant="ghost"`.
- Links and "view more": `text-primary hover:underline`.

---

## 4. Typography

- Page title: `text-2xl font-semibold tracking-tight text-foreground`
- Page subtitle/description: `text-sm text-muted-foreground`
- Section/card title: `text-base font-semibold`
- Table header: `text-xs font-medium uppercase tracking-wide text-muted-foreground`
- Table cell (text): `text-sm`
- Table cell (**numeric** — odometer, cost, %, counts): `font-mono text-sm tabular-nums`
- KPI value: `font-mono text-3xl font-semibold tracking-tight`
- KPI label: `text-xs font-medium uppercase tracking-wide text-muted-foreground`
- Form label: `text-sm font-medium` (already the shadcn `<Label>` default)
- Helper/error text: `text-xs text-muted-foreground` / `text-xs text-destructive`

---

## 5. Component patterns

Copy these verbatim — don't reinvent per-page. If a shared component doesn't
exist yet under `components/shared/`, that's a Leader task in progress (see
`next-steps.md`) — build your page against the prop shape below even if you
have to stub it locally for an hour.

### PageHeader
Every page starts with this, no exceptions:
```tsx
<div className="flex items-center justify-between gap-4 pb-6">
  <div>
    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fleet</h1>
    <p className="text-sm text-muted-foreground">Manage your vehicle registry.</p>
  </div>
  <Button>+ Add Vehicle</Button> {/* primary action, right-aligned */}
</div>
```

### StatusBadge
One component, driven by the map in §3:
```tsx
<Badge className={cn("border-0 font-medium", statusColorMap[status])}>
  {statusLabelMap[status]}
</Badge>
```
Label text is Title Case (`"In Shop"` not `"IN_SHOP"`).

### KpiCard
```tsx
<div className="border border-border bg-card p-4">
  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
    Fleet Utilization
  </p>
  <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-foreground">
    81<span className="text-lg text-muted-foreground">%</span>
  </p>
</div>
```
Optional left accent border for at-a-glance category (`border-l-2
border-l-primary`) — use sparingly, only on the KPI row, not every card.

### DataTable
Use `components/ui/data-table.tsx` (already built, don't rewrite it). Rules:
- Numeric columns get `className: "font-mono tabular-nums"` in the `ColumnDef`.
- Status columns render `<StatusBadge />`, never raw enum text.
- Row click (if the row opens detail/edit) → `className="cursor-pointer hover:bg-muted/50"`.
- Empty state: pass a specific `emptyMessage` per page ("No vehicles yet — add
  your first one." not the generic default).

### FilterBar
Horizontal row above the table, `flex flex-wrap items-center gap-2`. Each
filter is a `<Select>` sized `size="sm"` (Type: All / Status: All / Region:
All pattern from the wireframes). Free-text search gets its own bordered
`<Input>` with a `Search` icon, right-aligned or full-width on mobile.

### FormModal
Build on `<Dialog>` (already in `components/ui/dialog.tsx`). Structure:
```tsx
<DialogContent>
  <DialogHeader>
    <DialogTitle>Add Vehicle</DialogTitle>
    <DialogDescription>Register a new vehicle in the fleet.</DialogDescription>
  </DialogHeader>
  <form className="space-y-4">{/* Label + Input pairs, space-y-4 */}</form>
  <DialogFooter>
    <Button variant="outline" type="button">Cancel</Button>
    <Button type="submit">Save</Button>
  </DialogFooter>
</DialogContent>
```
Validation errors render inline under the field (`text-xs text-destructive
mt-1`), not as a toast — toasts are for the *result* of the submit (success/
network failure), not per-field validation.

### ConfirmDialog
Use `<AlertDialog>` (already exists) for anything destructive/irreversible
(Retire vehicle, Cancel trip, Close maintenance). Never use a plain `confirm()`.

---

## 6. Layout & responsiveness

- Content area max width: none needed — the sidebar+topbar shell already
  constrains it (`app/(app)/layout.tsx`). Just use `p-4 sm:p-6` on your page
  root and let content breathe at `space-y-6`.
- Tables: wrap in `overflow-x-auto` on mobile rather than trying to make every
  column responsive — acceptable to horizontal-scroll a dense ops table on a
  phone. Filters/actions above the table should still stack cleanly
  (`flex-wrap`).
- Breakpoint convention: mobile-first, `sm:`/`lg:` are the two breakpoints
  that matter here (sidebar already switches at `lg:`). Don't introduce `md:`
  unless you have a specific reason.
- Cards in a grid (KPIs, analytics): `grid grid-cols-2 gap-4 lg:grid-cols-4` —
  2-up on mobile, 4-up on desktop is the standard KPI row pattern.

---

## 7. Motion (Framer Motion is already a dependency — use it, sparingly)

Use motion for:
- Dialog/modal enter-exit (Radix + shadcn already animate this by default —
  don't add extra motion on top).
- A number counting up on first KPI load (`framer-motion`'s `animate` on a
  motion value) — nice touch on the Dashboard, not required elsewhere.
- List item enter when a new row appears after create (subtle `opacity`/`y`
  fade, ~150ms).

Do **not** animate: table row hover (use CSS `transition-colors` — cheaper
and instant), page-to-page transitions (Next.js navigation should feel
instant, not have a fade delay), anything on every re-render of live data
(dispatch board polling shouldn't visibly "pop" every refresh).

---

## 8. Per-screen visual notes

- **Dashboard** — KPI row (7 cards, `grid-cols-2 lg:grid-cols-4`, wrap to 2
  rows), then a two-column split: Recent Trips table (left, wider) + Vehicle
  Status bars (right, narrower) — horizontal bars using `chart-1..4` colors
  matching each status, not a pie chart (matches wireframe intent, reads
  faster at a glance).
- **Fleet / Drivers** — straightforward DataTable + FilterBar + FormModal.
  The "premium" touch here is just doing §3–§5 consistently — don't over-design.
- **Trips** — this is the most "alive" screen. Give the Live Board cards a
  left accent border matching trip status color, and the capacity-exceeded
  warning should be a `border border-destructive/40 bg-destructive/10 p-3
  text-sm text-destructive` block, not a plain red text line — make it look
  like a real validation blocker, matching the wireframe's callout box.
- **Maintenance** — the two transition arrows ("Available → In Shop", "In
  Shop → Available") from the wireframe are a nice explanatory touch — render
  them as small muted diagrams, not literal text arrows: icon + label +
  `ArrowRight` icon + icon + label, all in `text-xs text-muted-foreground`.
- **Analytics** — the four KPI cards use the same `KpiCard` as Dashboard for
  consistency. Charts: keep axis labels in `font-mono text-xs
  text-muted-foreground`, bars in `chart-1`/`chart-3`, gridlines in
  `border/40` — don't let a charting library's default theme leak in
  (override its colors to match our tokens).
- **Settings** — the RBAC matrix table is read-only for everyone except
  Fleet Manager; render `✓`/`view`/`—` as plain text in `font-mono` (this is
  a data table, not a form) with the "FULL" column in `text-foreground` and
  "NONE" rows in `text-muted-foreground/60` so the eye jumps to what a role
  *can* do.

---

## 9. Before you open a PR (visual checklist)

- [ ] No hardcoded hex colors or Tailwind default palette classes (`green-500`, `orange-400`, etc.) — only theme tokens.
- [ ] No `rounded-lg`/`rounded-xl` added to cards/tables/page sections.
- [ ] Every numeric value in a table or KPI uses `font-mono tabular-nums`.
- [ ] Every status uses `StatusBadge` / the §3 color map — no raw enum text, no one-off colors.
- [ ] Dark mode checked (toggle via system theme or `next-themes` — the app is dark-first per the wireframes, but light mode must not break).
- [ ] Every destructive action goes through `<AlertDialog>`, not a raw `confirm()`.
- [ ] Loading and empty states exist and use the DataTable's built-in props — no blank flash, no "undefined" text.
