import { NextRequest } from "next/server";
import { Api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireAccess, AuthError } from "@/lib/session";
import { createMaintenanceSchema } from "@/types/maintenance";
import { openMaintenance } from "@/lib/services/maintenance.service";
import { BusinessError } from "@/lib/errors";

export async function GET() {
  try {
    // Read session to enforce FLEET VIEW permission
    await requireAccess("FLEET", "VIEW");

    const logs = await prisma.maintenanceLog.findMany({
      include: {
        vehicle: true,
      },
      orderBy: { openedAt: "desc" },
    });

    return Api.ok(logs);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    logger.error("Failed to fetch maintenance logs list", error);
    return Api.internalError();
  }
}

export async function POST(req: NextRequest) {
  try {
    // Read session to enforce FLEET FULL permission
    await requireAccess("FLEET", "FULL");

    const body = await req.json();
    const result = createMaintenanceSchema.safeParse(body);

    if (!result.success) {
      return Api.badRequest("Invalid input data", result.error.format());
    }

    const log = await openMaintenance(result.data);

    return Api.created(log);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    if (error instanceof BusinessError) {
      return Api.badRequest(error.message, { code: error.code });
    }

    logger.error("Failed to create maintenance log", error);
    return Api.internalError();
  }
}
