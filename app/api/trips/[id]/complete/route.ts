import { NextRequest } from "next/server";
import { Api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { requireAccess, AuthError } from "@/lib/session";
import { completeTrip } from "@/lib/services/trip.service";
import { completeTripSchema } from "@/types/trip";
import { BusinessError } from "@/lib/errors";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAccess("TRIPS", "FULL");
    const { id } = await params;
    const body = await req.json();
    const parsed = completeTripSchema.parse(body);
    const trip = await completeTrip(id, parsed);
    return Api.ok(trip);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized() : Api.forbidden();
    }
    if (error instanceof BusinessError) {
      return Api.badRequest(error.message, { code: error.code });
    }
    logger.error("Failed to complete trip", error);
    return Api.internalError();
  }
}
