import { NextRequest } from "next/server";
import { Api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { requireAccess, AuthError } from "@/lib/session";
import { deleteMaintenance } from "@/lib/services/maintenance.service";
import { BusinessError } from "@/lib/errors";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Read session to enforce FLEET FULL permission
    await requireAccess("FLEET", "FULL");

    const { id } = await params;
    if (!id) {
      return Api.badRequest("Maintenance log ID is required");
    }

    await deleteMaintenance(id);

    return Api.ok({ message: "Maintenance log deleted successfully" });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    if (error instanceof BusinessError) {
      return Api.badRequest(error.message, { code: error.code });
    }

    logger.error("Failed to delete maintenance log", error);
    return Api.internalError();
  }
}
