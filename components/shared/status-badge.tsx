import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Canonical status → color mapping (design.md §3). Covers every status enum
 * in the schema (Vehicle, Driver, Trip, MaintenanceLog) — one lookup so
 * every table/badge in the app colors state identically.
 */
const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-success/10 text-success border border-success/20 dark:bg-success/15",
  COMPLETED: "bg-success/10 text-success border border-success/20 dark:bg-success/15",

  ON_TRIP: "bg-primary/10 text-primary border border-primary/20 dark:bg-primary/15",
  DISPATCHED: "bg-primary/10 text-primary border border-primary/20 dark:bg-primary/15",

  IN_SHOP: "bg-warning/10 text-warning border border-warning/20 dark:bg-warning/15",
  SUSPENDED: "bg-warning/10 text-warning border border-warning/20 dark:bg-warning/15",
  ACTIVE: "bg-warning/10 text-warning border border-warning/20 dark:bg-warning/15",

  RETIRED: "bg-destructive/10 text-destructive border border-destructive/20",
  CANCELLED: "bg-destructive/10 text-destructive border border-destructive/20",

  DRAFT: "bg-muted text-muted-foreground border border-border",
  OFF_DUTY: "bg-muted text-muted-foreground border border-border",
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "AVAILABLE",
  ON_TRIP: "ON TRIP",
  IN_SHOP: "IN SHOP",
  RETIRED: "RETIRED",
  OFF_DUTY: "OFF DUTY",
  SUSPENDED: "SUSPENDED",
  DRAFT: "DRAFT",
  DISPATCHED: "DISPATCHED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  ACTIVE: "ACTIVE",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const label = STATUS_LABELS[status] ?? status;
  return (
    <Badge
      className={cn(
        "border font-semibold uppercase rounded-full px-2 py-0.5 text-[10px] tracking-wider select-none shadow-none",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border-border",
        className
      )}
    >
      {label}
    </Badge>
  );
}
