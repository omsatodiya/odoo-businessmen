import type { NextRequest } from "next/server";

import { Api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { AuthError, requireAccess } from "@/lib/session";
import { updateSettingsSchema } from "@/types/settings-types";

const DEFAULT_SETTINGS = {
  id: "singleton",
  depotName: "Gandhinagar Depot GJ-14",
  currency: "INR",
  distanceUnit: "Kilometers",
};

export async function GET() {
  try {
    await requireAccess("SETTINGS", "VIEW");

    // Self-healing: create the singleton row with defaults if it's missing
    // (e.g. a fresh/wiped database) instead of erroring.
    const settings = await prisma.appSettings.upsert({
      where: { id: "singleton" },
      update: {},
      create: DEFAULT_SETTINGS,
    });

    return Api.ok(settings);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    logger.error("Error in GET /api/settings", error);
    return Api.internalError();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAccess("SETTINGS", "FULL");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Api.badRequest("Request body must be valid JSON");
    }

    const result = updateSettingsSchema.safeParse(body);
    if (!result.success) {
      return Api.badRequest("Invalid settings payload", result.error.flatten());
    }

    const settings = await prisma.appSettings.upsert({
      where: { id: "singleton" },
      update: result.data,
      create: { id: "singleton", ...result.data },
    });

    return Api.ok(settings);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    logger.error("Error in PATCH /api/settings", error);
    return Api.internalError();
  }
}
