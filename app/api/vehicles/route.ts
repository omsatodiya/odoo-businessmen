import { NextRequest } from "next/server";
import { Api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireAccess, AuthError } from "@/lib/session";
import { createVehicleSchema } from "@/types/vehicle";
import { VehicleType, VehicleStatus, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    // Read session to enforce FLEET VIEW permission
    await requireAccess("FLEET", "VIEW");

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as VehicleType | null;
    const status = searchParams.get("status") as VehicleStatus | null;
    const q = searchParams.get("q") || "";

    // Build the query conditions
    const where: Prisma.VehicleWhereInput = {};

    if (type && Object.values(VehicleType).includes(type)) {
      where.type = type;
    }

    if (status && Object.values(VehicleStatus).includes(status)) {
      where.status = status;
    }

    if (q) {
      where.OR = [
        { regNo: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return Api.ok(vehicles);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    logger.error("Failed to fetch vehicles list", error);
    return Api.internalError();
  }
}

export async function POST(req: NextRequest) {
  try {
    // Read session to enforce FLEET FULL permission
    await requireAccess("FLEET", "FULL");

    const body = await req.json();
    const result = createVehicleSchema.safeParse(body);

    if (!result.success) {
      return Api.badRequest("Invalid input data", result.error.format());
    }

    const vehicle = await prisma.vehicle.create({
      data: result.data,
    });

    return Api.created(vehicle);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }

    // Check for Prisma duplicate key error (P2002) on regNo
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return Api.conflict("Registration number already exists");
    }

    logger.error("Failed to create vehicle", error);
    return Api.internalError();
  }
}
