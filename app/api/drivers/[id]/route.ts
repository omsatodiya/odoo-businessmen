import { NextRequest } from "next/server";
import { requireAccess, AuthError } from "@/lib/session";
import { Api } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { updateDriverSchema } from "@/types/driver-types";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAccess("DRIVERS", "FULL");
    const body = await req.json();

    const result = updateDriverSchema.safeParse(body);
    if (!result.success) {
      return Api.badRequest("Invalid input data", result.error.format());
    }

    if (result.data.status === "ON_TRIP") {
      return Api.badRequest("Cannot manually transition driver status to ON_TRIP. Only trip service can set this status.");
    }

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id },
    });
    if (!existingDriver) {
      return Api.notFound("Driver not found");
    }

    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: {
        name: result.data.name,
        email: result.data.email,
        licenseNo: result.data.licenseNo,
        licenseCategory: result.data.licenseCategory,
        licenseExpiry: result.data.licenseExpiry,
        contact: result.data.contact,
        safetyScore: result.data.safetyScore,
        status: result.data.status,
      },
    });

    return Api.ok(updatedDriver);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Api.conflict("License number already exists");
    }
    logger.error("Error in PATCH /api/drivers/[id]", error);
    return Api.internalError();
  }
}
