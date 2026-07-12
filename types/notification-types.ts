export type NotificationSeverity = "destructive" | "warning" | "success";

export interface NotificationItem {
  id: string;
  severity: NotificationSeverity;
  title: string;
  description: string;
  href: string;
  /** ISO timestamp of the underlying event (license expiry date, maintenance opened date, etc). */
  timestamp: string;
}
