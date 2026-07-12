import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAccess, AuthError } from "@/lib/session";
import { Api } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { fuelLogSchema } from "@/types/fuel-types";
import { logger } from "@/lib/logger";

function toNumber(value: unknown): number {
  return value === null || value === undefined ? 0 : Number(value);
}

export async function GET(req: NextRequest) {
  try {
    await requireAccess("FUEL_EXPENSES", "VIEW");
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId");

    const where: Prisma.FuelLogWhereInput = {};
    if (vehicleId && vehicleId !== "ALL") {
      where.vehicleId = vehicleId;
    }

    const fuelLogs = await prisma.fuelLog.findMany({
      where,
      include: {
        vehicle: {
          select: {
            regNo: true,
            name: true,
          },
        },
        trip: {
          select: {
            code: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Calculate metadata across shown data (filtered by vehicle if specified)
    const [fuelAgg, maintenanceAgg] = await Promise.all([
      prisma.fuelLog.aggregate({
        where,
        _sum: { cost: true },
      }),
      prisma.maintenanceLog.aggregate({
        where: vehicleId && vehicleId !== "ALL" ? { vehicleId } : {},
        _sum: { cost: true },
      }),
    ]);

    const totalFuelCost = toNumber(fuelAgg._sum.cost);
    const totalMaintenanceCost = toNumber(maintenanceAgg._sum.cost);
    const totalOperationalCost = totalFuelCost + totalMaintenanceCost;

    return Api.ok(fuelLogs, {
      totalFuelCost,
      totalMaintenanceCost,
      totalOperationalCost,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    logger.error("Error in GET /api/fuel-logs", error);
    return Api.internalError();
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAccess("FUEL_EXPENSES", "FULL");
    const body = await req.json();
    const result = fuelLogSchema.safeParse(body);
    if (!result.success) {
      return Api.badRequest("Invalid input data", result.error.format());
    }

    const fuelLog = await prisma.fuelLog.create({
      data: {
        vehicleId: result.data.vehicleId,
        tripId: result.data.tripId || null,
        liters: result.data.liters,
        cost: result.data.cost,
        date: result.data.date || new Date(),
      },
    });

    return Api.created(fuelLog);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    logger.error("Error in POST /api/fuel-logs", error);
    return Api.internalError();
  }
}
