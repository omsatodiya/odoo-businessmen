import { Api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { can, getRbacMatrix } from "@/lib/rbac";
import { AuthError, requireAuth } from "@/lib/session";
import type { NotificationItem, NotificationCategory } from "@/types/notification-types";

const LICENSE_WARNING_WINDOW_DAYS = 14;
const MAINTENANCE_STALE_DAYS = 3;
const RECENT_COMPLETION_WINDOW_DAYS = 7;
const ROUTE_DEVIATION_THRESHOLD = 1.2; // actual distance > 20% over planned
const AVERAGE_SPEED_KMH = 50; // same assumption used on the Dashboard's ETA estimate
const DAY_MS = 24 * 60 * 60 * 1000;

const CATEGORY_RANK: Record<NotificationCategory, number> = {
  LICENSE_EXPIRED: 0,
  VEHICLE_IN_SHOP: 1,
  LICENSE_EXPIRING: 2,
  ROUTE_DEVIATION: 3,
  TRIP_IN_PROGRESS: 4,
  TRIP_COMPLETED: 5,
};

export async function GET() {
  try {
    const session = await requireAuth();
    const matrix = await getRbacMatrix();

    const notifications: NotificationItem[] = [];
    const now = new Date();

    if (can(matrix, session.role, "DRIVERS", "VIEW")) {
      const warningCutoff = new Date(now.getTime() + LICENSE_WARNING_WINDOW_DAYS * DAY_MS);

      const drivers = await prisma.driver.findMany({
        where: { licenseExpiry: { lt: warningCutoff }, status: { not: "SUSPENDED" } },
        select: { id: true, name: true, licenseNo: true, licenseExpiry: true },
        orderBy: { licenseExpiry: "asc" },
      });

      for (const driver of drivers) {
        const isExpired = driver.licenseExpiry.getTime() < now.getTime();
        const days = Math.max(0, Math.round(Math.abs(driver.licenseExpiry.getTime() - now.getTime()) / DAY_MS));

        notifications.push({
          id: `license-${driver.id}`,
          category: isExpired ? "LICENSE_EXPIRED" : "LICENSE_EXPIRING",
          severity: isExpired ? "destructive" : "warning",
          title: isExpired ? "License expired" : "License expiring soon",
          description: isExpired
            ? `Driver ${driver.name}'s license (${driver.licenseNo}) has expired. Action required before dispatch.`
            : `Driver ${driver.name}'s license (${driver.licenseNo}) expires in ${days} day(s). Schedule renewal.`,
          href: "/drivers",
          timestamp: driver.licenseExpiry.toISOString(),
        });
      }
    }

    if (can(matrix, session.role, "FLEET", "VIEW")) {
      const staleCutoff = new Date(now.getTime() - MAINTENANCE_STALE_DAYS * DAY_MS);

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
        const daysInShop = Math.round((now.getTime() - log.openedAt.getTime()) / DAY_MS);
        notifications.push({
          id: `maintenance-${log.id}`,
          category: "VEHICLE_IN_SHOP",
          severity: "warning",
          title: "Vehicle in shop",
          description: `${log.vehicle.regNo} (${log.vehicle.name}) has been in for "${log.type}" for ${daysInShop} day(s).`,
          href: "/maintenance",
          timestamp: log.openedAt.toISOString(),
        });
      }
    }

    if (can(matrix, session.role, "TRIPS", "VIEW")) {
      const [inProgressTrips, recentlyCompletedTrips] = await Promise.all([
        prisma.trip.findMany({
          where: { status: "DISPATCHED" },
          select: {
            id: true,
            code: true,
            destination: true,
            plannedDistanceKm: true,
            dispatchedAt: true,
            driver: { select: { name: true } },
          },
          orderBy: { dispatchedAt: "desc" },
        }),
        prisma.trip.findMany({
          where: {
            status: "COMPLETED",
            completedAt: { gt: new Date(now.getTime() - RECENT_COMPLETION_WINDOW_DAYS * DAY_MS) },
          },
          select: {
            id: true,
            code: true,
            source: true,
            destination: true,
            plannedDistanceKm: true,
            startOdometer: true,
            endOdometer: true,
            completedAt: true,
            driver: { select: { name: true } },
          },
          orderBy: { completedAt: "desc" },
        }),
      ]);

      for (const trip of inProgressTrips) {
        if (!trip.dispatchedAt) continue;
        const durationMin = (trip.plannedDistanceKm / AVERAGE_SPEED_KMH) * 60;
        const elapsedMin = (now.getTime() - trip.dispatchedAt.getTime()) / 60_000;
        const remainingMin = Math.max(5, Math.round(durationMin - elapsedMin));
        const etaLabel =
          remainingMin > 60
            ? `~${Math.floor(remainingMin / 60)}h ${remainingMin % 60}m`
            : `~${remainingMin} min`;

        notifications.push({
          id: `trip-progress-${trip.id}`,
          category: "TRIP_IN_PROGRESS",
          severity: "primary",
          title: "Trip in progress",
          description: `${trip.driver.name} is currently on a dispatched trip to ${trip.destination}. ETA: ${etaLabel}.`,
          href: "/trips",
          timestamp: trip.dispatchedAt.toISOString(),
        });
      }

      for (const trip of recentlyCompletedTrips) {
        if (!trip.completedAt) continue;

        notifications.push({
          id: `trip-completed-${trip.id}`,
          category: "TRIP_COMPLETED",
          severity: "success",
          title: "Trip completed",
          description: `Trip ${trip.source} → ${trip.destination} completed successfully by ${trip.driver.name}.`,
          href: "/trips",
          timestamp: trip.completedAt.toISOString(),
        });

        if (trip.startOdometer !== null && trip.endOdometer !== null) {
          const actualDistance = trip.endOdometer - trip.startOdometer;
          if (
            trip.plannedDistanceKm > 0 &&
            actualDistance > trip.plannedDistanceKm * ROUTE_DEVIATION_THRESHOLD
          ) {
            notifications.push({
              id: `route-deviation-${trip.id}`,
              category: "ROUTE_DEVIATION",
              severity: "warning",
              title: "Route deviation flagged",
              description: `Trip ${trip.code} (driver: ${trip.driver.name}) ran ${actualDistance}km, well over the planned ${trip.plannedDistanceKm}km.`,
              href: "/trips",
              timestamp: trip.completedAt.toISOString(),
            });
          }
        }
      }
    }

    // Stable sort — each query above already orders sensibly within its own
    // category (soonest-expiry-first for licenses, most-recent-first for
    // trips), so grouping by category rank alone preserves that.
    notifications.sort((a, b) => CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category]);

    return Api.ok(notifications);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    logger.error("Error in GET /api/notifications", error);
    return Api.internalError();
  }
}
