import { NextRequest } from "next/server";
import { Api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireAccess, AuthError } from "@/lib/session";
import { updateVehicleSchema } from "@/types/vehicle";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Read session to enforce FLEET FULL permission
    await requireAccess("FLEET", "FULL");

    const { id } = await params;
    if (!id) {
      return Api.badRequest("Vehicle ID is required");
    }

    const body = await req.json();
    const result = updateVehicleSchema.safeParse(body);

    if (!result.success) {
      return Api.badRequest("Invalid input data", result.error.format());
    }

    // Check if vehicle exists
    const existing = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!existing) {
      return Api.notFound("Vehicle not found");
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: result.data,
    });

    // Sync maintenance logs based on status transition
    if (result.data.status === "IN_SHOP" && existing.status !== "IN_SHOP") {
      // Check if there is already an active log
      const activeLog = await prisma.maintenanceLog.findFirst({
        where: { vehicleId: id, status: "ACTIVE" },
      });
      if (!activeLog) {
        await prisma.maintenanceLog.create({
          data: {
            vehicleId: id,
            type: "General Maintenance",
            cost: 0,
            notes: "Created automatically via vehicle status change to IN_SHOP",
            status: "ACTIVE",
          },
        });
      }
    } else if (existing.status === "IN_SHOP" && result.data.status && result.data.status !== "IN_SHOP") {
      // Close active logs if moved out of IN_SHOP
      await prisma.maintenanceLog.updateMany({
        where: { vehicleId: id, status: "ACTIVE" },
        data: {
          status: "COMPLETED",
          closedAt: new Date(),
        },
      });
    }

    return Api.ok(vehicle);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }

    // Check for Prisma duplicate key error (P2002) on regNo
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return Api.conflict("Registration number already exists");
    }

    logger.error("Failed to update vehicle", error);
    return Api.internalError();
  }
}
