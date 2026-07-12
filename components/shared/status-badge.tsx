import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Canonical status → color mapping (design.md §3). Covers every status enum
 * in the schema (Vehicle, Driver, Trip, MaintenanceLog) — one lookup so
 * every table/badge in the app colors state identically.
 */
const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-success/15 text-success",
  COMPLETED: "bg-success/15 text-success",

  ON_TRIP: "bg-primary/15 text-primary",
  DISPATCHED: "bg-primary/15 text-primary",

  IN_SHOP: "bg-warning/15 text-warning",
  SUSPENDED: "bg-warning/15 text-warning",
  ACTIVE: "bg-warning/15 text-warning",

  RETIRED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-destructive/10 text-destructive",

  DRAFT: "bg-muted text-muted-foreground",
  OFF_DUTY: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  IN_SHOP: "In Shop",
  RETIRED: "Retired",
  OFF_DUTY: "Off Duty",
  SUSPENDED: "Suspended",
  DRAFT: "Draft",
  DISPATCHED: "Dispatched",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  ACTIVE: "Active",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge className={cn("border-0 font-medium", STATUS_STYLES[status] ?? "bg-muted text-muted-foreground", className)}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
