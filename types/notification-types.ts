export type NotificationSeverity = "destructive" | "warning" | "success" | "primary";

export type NotificationCategory =
  | "TRIP_COMPLETED"
  | "TRIP_IN_PROGRESS"
  | "LICENSE_EXPIRING"
  | "LICENSE_EXPIRED"
  | "VEHICLE_IN_SHOP"
  | "ROUTE_DEVIATION";

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  description: string;
  href: string;
  /** ISO timestamp of the underlying event. */
  timestamp: string;
}

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  TRIP_COMPLETED: "Trip Completed",
  TRIP_IN_PROGRESS: "Info",
  LICENSE_EXPIRING: "License Expiring",
  LICENSE_EXPIRED: "License Expired",
  VEHICLE_IN_SHOP: "Vehicle In Shop",
  ROUTE_DEVIATION: "Route Deviation",
};
