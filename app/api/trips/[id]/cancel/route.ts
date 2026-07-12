import { NextRequest } from "next/server";
import { Api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { requireAccess, AuthError } from "@/lib/session";
import { cancelTrip } from "@/lib/services/trip.service";
import { cancelTripSchema } from "@/types/trip";
import { BusinessError } from "@/lib/errors";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAccess("TRIPS", "FULL");
    const { id } = await params;
    const body = await req.json();
    const { reason } = cancelTripSchema.parse(body);
    const trip = await cancelTrip(id, reason);
    return Api.ok(trip);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized() : Api.forbidden();
    }
    if (error instanceof BusinessError) {
      return Api.badRequest(error.message, { code: error.code });
    }
    logger.error("Failed to cancel trip", error);
    return Api.internalError();
  }
}
