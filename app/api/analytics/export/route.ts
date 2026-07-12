import { NextResponse } from "next/server";
import { Api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { requireAccess, AuthError } from "@/lib/session";
import { getAllVehicleAnalytics } from "@/lib/analytics";

export async function GET() {
  try {
    await requireAccess("ANALYTICS", "VIEW");
    const vehicles = await getAllVehicleAnalytics();

    const header = "Reg No,Name,Distance (km),Fuel (L),Efficiency (km/L),Op. Cost,Revenue,ROI (%)";
    const rows = vehicles.map(
      (v) =>
        `${v.regNo},${v.name},${v.distanceKm},${v.fuelLiters},${v.fuelEfficiencyKmPerL?.toFixed(2) ?? "N/A"},${v.operationalCost.toFixed(2)},${v.revenue.toFixed(2)},${v.roiPercent?.toFixed(2) ?? "N/A"}`,
    );

    const csv = [header, ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=transitops-analytics.csv",
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized() : Api.forbidden();
    }
    logger.error("Failed to export analytics CSV", error);
    return Api.internalError();
  }
}
