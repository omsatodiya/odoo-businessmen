import { NextRequest } from "next/server";
import { Api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireAccess, AuthError } from "@/lib/session";
import { VehicleType, VehicleStatus, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    // Authenticate and check DASHBOARD VIEW access
    await requireAccess("DASHBOARD", "VIEW");

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as VehicleType | null;
    const status = searchParams.get("status") as VehicleStatus | null;
    const region = searchParams.get("region") || "";

    // 1. Fetch unique regions from Vehicle table to populate filters
    const vehiclesWithRegions = await prisma.vehicle.findMany({
      select: { region: true },
      where: {
        region: {
          not: null,
        },
        NOT: {
          region: "",
        },
      },
      distinct: ["region"],
    });

    const regions = vehiclesWithRegions
      .map((v) => v.region)
      .filter((r): r is string => typeof r === "string" && r.length > 0)
      .sort((a, b) => a.localeCompare(b));

    // 2. Base vehicle filters (Type and Region)
    const baseVehicleWhere: Prisma.VehicleWhereInput = {};
    if (type && Object.values(VehicleType).includes(type)) {
      baseVehicleWhere.type = type;
    }
    if (region) {
      baseVehicleWhere.region = region;
    }

    // Query vehicles for KPIs and Status Distribution (ignores vehicle status filter)
    const vehiclesForKPIs = await prisma.vehicle.findMany({
      where: baseVehicleWhere,
      select: {
        status: true,
      },
    });

    const activeVehicles = vehiclesForKPIs.filter((v) => v.status === "ON_TRIP").length;
    const availableVehicles = vehiclesForKPIs.filter((v) => v.status === "AVAILABLE").length;
    const inMaintenanceVehicles = vehiclesForKPIs.filter((v) => v.status === "IN_SHOP").length;
    const retiredVehicles = vehiclesForKPIs.filter((v) => v.status === "RETIRED").length;
    const totalVehicles = vehiclesForKPIs.length;

    const nonRetiredCount = totalVehicles - retiredVehicles;
    const fleetUtilization = nonRetiredCount > 0 ? Math.round((activeVehicles / nonRetiredCount) * 100) : 0;

    // 3. Trip Metrics filtered by Type and Region
    const baseTripVehicleWhere: Prisma.VehicleWhereInput = {};
    if (type && Object.values(VehicleType).includes(type)) {
      baseTripVehicleWhere.type = type;
    }
    if (region) {
      baseTripVehicleWhere.region = region;
    }

    const baseTripWhere: Prisma.TripWhereInput = {};
    if (Object.keys(baseTripVehicleWhere).length > 0) {
      baseTripWhere.vehicle = baseTripVehicleWhere;
    }

    const [activeTrips, pendingTrips] = await Promise.all([
      prisma.trip.count({
        where: {
          ...baseTripWhere,
          status: "DISPATCHED",
        },
      }),
      prisma.trip.count({
        where: {
          ...baseTripWhere,
          status: "DRAFT",
        },
      }),
    ]);

    // 4. Drivers on Duty (Available or On Trip drivers)
    const driversOnDuty = await prisma.driver.count({
      where: {
        status: {
          in: ["AVAILABLE", "ON_TRIP"],
        },
      },
    });

    // 5. Recent Trips Table (applies Type, Region, and Status filters)
    const tripFilterVehicleWhere: Prisma.VehicleWhereInput = {};
    if (type && Object.values(VehicleType).includes(type)) {
      tripFilterVehicleWhere.type = type;
    }
    if (region) {
      tripFilterVehicleWhere.region = region;
    }
    if (status && Object.values(VehicleStatus).includes(status)) {
      tripFilterVehicleWhere.status = status;
    }

    const tripFilterWhere: Prisma.TripWhereInput = {};
    if (Object.keys(tripFilterVehicleWhere).length > 0) {
      tripFilterWhere.vehicle = tripFilterVehicleWhere;
    }

    const recentTrips = await prisma.trip.findMany({
      where: tripFilterWhere,
      include: {
        vehicle: {
          select: {
            regNo: true,
            name: true,
            status: true,
          },
        },
        driver: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return Api.ok({
      regions,
      kpis: {
        activeVehicles,
        availableVehicles,
        inMaintenanceVehicles,
        activeTrips,
        pendingTrips,
        driversOnDuty,
        fleetUtilization,
      },
      recentTrips,
      vehicleStatusDistribution: {
        available: availableVehicles,
        onTrip: activeVehicles,
        inShop: inMaintenanceVehicles,
        retired: retiredVehicles,
        total: totalVehicles,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    logger.error("Failed to fetch dashboard metrics", error);
    return Api.internalError();
  }
}
