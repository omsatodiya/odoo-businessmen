import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { Api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { requireAccess, AuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  vehicleId: z.string().optional().nullable(),
});

interface LedgerEntry {
  date: Date;
  type: string;
  regNo: string;
  vehicleName: string;
  tripCode: string;
  qty: string;
  amount: number;
  notes: string;
}

function csvEscape(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export async function GET(req: NextRequest) {
  try {
    await requireAccess("FUEL_EXPENSES", "VIEW");
    
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      vehicleId: searchParams.get("vehicleId"),
    });

    if (!parsed.success) {
      return Api.badRequest("Invalid query parameters");
    }

    const vehicleId = parsed.data.vehicleId;
    const where: any = {};
    if (vehicleId && vehicleId !== "ALL") {
      where.vehicleId = vehicleId;
    }

    // Fetch both fuel logs and expenses matching filters
    const [fuelLogs, expenses] = await Promise.all([
      prisma.fuelLog.findMany({
        where,
        include: {
          vehicle: {
            select: { regNo: true, name: true },
          },
          trip: {
            select: { code: true },
          },
        },
      }),
      prisma.expense.findMany({
        where,
        include: {
          vehicle: {
            select: { regNo: true, name: true },
          },
          trip: {
            select: { code: true },
          },
        },
      }),
    ]);

    const entries: LedgerEntry[] = [];

    // Map fuel logs
    for (const log of fuelLogs) {
      entries.push({
        date: new Date(log.date),
        type: "FUEL",
        regNo: log.vehicle?.regNo || "",
        vehicleName: log.vehicle?.name || "",
        tripCode: log.trip?.code || "—",
        qty: `${log.liters.toFixed(1)} L`,
        amount: Number(log.cost),
        notes: "Fuel Refill",
      });
    }

    // Map expenses
    for (const exp of expenses) {
      entries.push({
        date: new Date(exp.date),
        type: exp.type,
        regNo: exp.vehicle?.regNo || "",
        vehicleName: exp.vehicle?.name || "",
        tripCode: exp.trip?.code || "—",
        qty: "—",
        amount: Number(exp.amount),
        notes: exp.note || "",
      });
    }

    // Sort by date descending
    entries.sort((a, b) => b.date.getTime() - a.date.getTime());

    const header = "Date,Type,Vehicle Reg No,Vehicle Name,Trip Code,Liters/Qty,Amount,Notes/Details";
    const rows = entries.map(
      (e) =>
        `="${e.date.toISOString().split("T")[0]}",${csvEscape(e.type)},${csvEscape(e.regNo)},${csvEscape(e.vehicleName)},${csvEscape(e.tripCode)},${csvEscape(e.qty)},${e.amount.toFixed(2)},${csvEscape(e.notes)}`
    );

    const csv = [header, ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=transitops-fuel-expenses.csv",
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    logger.error("Failed to export fuel & expenses CSV", error);
    return Api.internalError();
  }
}
