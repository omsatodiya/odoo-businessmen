import { Api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { requireAccess, AuthError } from "@/lib/session";
import { getAllVehicleAnalytics, getMonthlyRevenue, fleetUtilization } from "@/lib/analytics";

export async function GET() {
  try {
    await requireAccess("ANALYTICS", "VIEW");
    const [vehicles, monthlyRevenue, utilization] = await Promise.all([
      getAllVehicleAnalytics(),
      getMonthlyRevenue(),
      fleetUtilization(),
    ]);
    return Api.ok({ vehicles, monthlyRevenue, fleetUtilization: utilization });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized() : Api.forbidden();
    }
    logger.error("Failed to fetch analytics", error);
    return Api.internalError();
  }
}
