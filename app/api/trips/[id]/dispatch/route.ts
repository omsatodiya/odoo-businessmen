import { NextRequest } from "next/server";
import { Api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { requireAccess, AuthError } from "@/lib/session";
import { dispatchTrip } from "@/lib/services/trip.service";
import { BusinessError } from "@/lib/errors";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAccess("TRIPS", "FULL");
    const { id } = await params;
    const trip = await dispatchTrip(id);
    return Api.ok(trip);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized() : Api.forbidden();
    }
    if (error instanceof BusinessError) {
      return Api.badRequest(error.message, { code: error.code });
    }
    logger.error("Failed to dispatch trip", error);
    return Api.internalError();
  }
}
