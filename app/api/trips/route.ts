import { NextRequest } from "next/server";
import { Api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireAccess, AuthError } from "@/lib/session";
import { createTrip } from "@/lib/services/trip.service";
import { createTripSchema } from "@/types/trip";
import { BusinessError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireAccess("TRIPS", "VIEW");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const vehicleId = searchParams.get("vehicleId");
    const driverId = searchParams.get("driverId");
    const q = searchParams.get("q");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;
    if (driverId) where.driverId = driverId;
    if (q) {
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { source: { contains: q, mode: "insensitive" } },
        { destination: { contains: q, mode: "insensitive" } },
      ];
    }

    const trips = await prisma.trip.findMany({
      where,
      include: { vehicle: { select: { regNo: true, name: true } }, driver: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return Api.ok(trips);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    logger.error("Failed to fetch trips", error);
    return Api.internalError();
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAccess("TRIPS", "FULL");
    const body = await req.json();
    const parsed = createTripSchema.parse(body);
    const trip = await createTrip(parsed);
    return Api.created(trip);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    if (error instanceof BusinessError) {
      return Api.badRequest(error.message, { code: error.code });
    }
    logger.error("Failed to create trip", error);
    return Api.internalError();
  }
}
