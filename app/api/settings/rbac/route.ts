import type { NextRequest } from "next/server";

import { Api } from "@/lib/api";
import { BusinessError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { setRbacMatrix } from "@/lib/rbac";
import { AuthError, requireAccess } from "@/lib/session";
import { updateRbacMatrixSchema } from "@/types/settings-types";

export async function PATCH(req: NextRequest) {
  try {
    // Only Fleet Manager can edit RBAC — same guard as the general Settings PATCH.
    await requireAccess("SETTINGS", "FULL");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Api.badRequest("Request body must be valid JSON");
    }

    const result = updateRbacMatrixSchema.safeParse(body);
    if (!result.success) {
      return Api.badRequest("Invalid RBAC matrix payload", result.error.flatten());
    }

    const matrix = await setRbacMatrix(result.data);

    return Api.ok({ rbacMatrix: matrix });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    if (error instanceof BusinessError) {
      return Api.badRequest(error.message, { code: error.code });
    }
    logger.error("Error in PATCH /api/settings/rbac", error);
    return Api.internalError();
  }
}
