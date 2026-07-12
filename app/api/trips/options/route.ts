import { Api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { requireAccess, AuthError } from "@/lib/session";
import { getDispatchOptions } from "@/lib/services/trip.service";

export async function GET() {
  try {
    await requireAccess("TRIPS", "VIEW");
    const options = await getDispatchOptions();
    return Api.ok(options);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    logger.error("Failed to fetch trip options", error);
    return Api.internalError();
  }
}
