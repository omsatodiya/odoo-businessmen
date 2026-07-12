import { Api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { can, getRbacMatrix } from "@/lib/rbac";
import { AuthError, requireAuth } from "@/lib/session";
import type { NotificationItem, NotificationSeverity } from "@/types/notification-types";

const LICENSE_WARNING_WINDOW_DAYS = 14;
const MAINTENANCE_STALE_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const SEVERITY_RANK: Record<NotificationSeverity, number> = {
  destructive: 0,
  warning: 1,
  success: 2,
};

export async function GET() {
  try {
    const session = await requireAuth();
    const matrix = await getRbacMatrix();

    const notifications: NotificationItem[] = [];

    if (can(matrix, session.role, "DRIVERS", "VIEW")) {
      const now = new Date();
      const warningCutoff = new Date(now.getTime() + LICENSE_WARNING_WINDOW_DAYS * DAY_MS);

      const drivers = await prisma.driver.findMany({
        where: {
          licenseExpiry: { lt: warningCutoff },
          status: { not: "SUSPENDED" },
        },
        select: { id: true, name: true, licenseNo: true, licenseExpiry: true },
        orderBy: { licenseExpiry: "asc" },
      });

      for (const driver of drivers) {
        const isExpired = driver.licenseExpiry.getTime() < now.getTime();
        const days = Math.max(0, Math.round(Math.abs(driver.licenseExpiry.getTime() - now.getTime()) / DAY_MS));

        notifications.push({
          id: `license-${driver.id}`,
          severity: isExpired ? "destructive" : "warning",
          title: isExpired ? "License expired" : "License expiring soon",
          description: isExpired
            ? `${driver.name}'s license (${driver.licenseNo}) expired ${days} day(s) ago.`
            : `${driver.name}'s license (${driver.licenseNo}) expires in ${days} day(s).`,
          href: "/drivers",
          timestamp: driver.licenseExpiry.toISOString(),
        });
      }
    }

    if (can(matrix, session.role, "FLEET", "VIEW")) {
      const staleCutoff = new Date(Date.now() - MAINTENANCE_STALE_DAYS * DAY_MS);

      const logs = await prisma.maintenanceLog.findMany({
        where: { status: "ACTIVE", openedAt: { lt: staleCutoff } },
        select: {
          id: true,
          type: true,
          openedAt: true,
          vehicle: { select: { regNo: true, name: true } },
        },
        orderBy: { openedAt: "asc" },
      });

      for (const log of logs) {
        const daysInShop = Math.round((Date.now() - log.openedAt.getTime()) / DAY_MS);
        notifications.push({
          id: `maintenance-${log.id}`,
          severity: "warning",
          title: "Vehicle in shop",
          description: `${log.vehicle.regNo} (${log.vehicle.name}) has been in for "${log.type}" for ${daysInShop} day(s).`,
          href: "/maintenance",
          timestamp: log.openedAt.toISOString(),
        });
      }
    }

    notifications.sort(
      (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.timestamp.localeCompare(b.timestamp)
    );

    return Api.ok(notifications);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    logger.error("Error in GET /api/notifications", error);
    return Api.internalError();
  }
}
