import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAccess, AuthError } from "@/lib/session";
import { Api } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/types/expense-types";
import { logger } from "@/lib/logger";

function toNumber(value: unknown): number {
  return value === null || value === undefined ? 0 : Number(value);
}

export async function GET(req: NextRequest) {
  try {
    await requireAccess("FUEL_EXPENSES", "VIEW");
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId");

    const where: Prisma.ExpenseWhereInput = {};
    if (vehicleId && vehicleId !== "ALL") {
      where.vehicleId = vehicleId;
    }

    const expenses = await prisma.expense.findMany({
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
            status: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Calculate metadata across shown data (filtered by vehicle if specified)
    const vehicleFilter = vehicleId && vehicleId !== "ALL" ? { vehicleId } : {};
    const [fuelAgg, maintenanceAgg] = await Promise.all([
      prisma.fuelLog.aggregate({
        where: vehicleFilter,
        _sum: { cost: true },
      }),
      prisma.maintenanceLog.aggregate({
        where: vehicleFilter,
        _sum: { cost: true },
      }),
    ]);

    const totalFuelCost = toNumber(fuelAgg._sum?.cost);
    const totalMaintenanceCost = toNumber(maintenanceAgg._sum?.cost);
    const totalOperationalCost = totalFuelCost + totalMaintenanceCost;

    return Api.ok(expenses, {
      totalFuelCost,
      totalMaintenanceCost,
      totalOperationalCost,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    logger.error("Error in GET /api/expenses", error);
    return Api.internalError();
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAccess("FUEL_EXPENSES", "FULL");
    const body = await req.json();
    const result = expenseSchema.safeParse(body);
    if (!result.success) {
      return Api.badRequest("Invalid input data", result.error.format());
    }

    const expense = await prisma.expense.create({
      data: {
        vehicleId: result.data.vehicleId,
        tripId: result.data.tripId || null,
        type: result.data.type,
        amount: result.data.amount,
        date: result.data.date || new Date(),
        note: result.data.note || null,
      },
    });

    return Api.created(expense);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    logger.error("Error in POST /api/expenses", error);
    return Api.internalError();
  }
}
