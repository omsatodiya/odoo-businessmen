import { requireAccess, AuthError } from "@/lib/session";
import { Api } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    // Both Fleet Manager and Financial Analyst need access to log fuel/expenses
    await requireAccess("FUEL_EXPENSES", "VIEW");

    const [vehicles, trips] = await Promise.all([
      prisma.vehicle.findMany({
        where: {
          status: { not: "RETIRED" },
        },
        select: {
          id: true,
          regNo: true,
          name: true,
        },
        orderBy: { regNo: "asc" },
      }),
      prisma.trip.findMany({
        select: {
          id: true,
          code: true,
          source: true,
          destination: true,
        },
        orderBy: { code: "desc" },
      }),
    ]);

    return Api.ok({ vehicles, trips });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    logger.error("Error in GET /api/fuel-logs/options", error);
    return Api.internalError();
  }
}
