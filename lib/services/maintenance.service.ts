import { prisma } from "@/lib/prisma";
import { BusinessError } from "@/lib/errors";

export interface OpenMaintenanceInput {
  vehicleId: string;
  type: string;
  cost: number;
  notes?: string;
}

export async function openMaintenance(input: OpenMaintenanceInput) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) throw new BusinessError("VEHICLE_NOT_FOUND", "Vehicle not found");
    if (vehicle.status === "RETIRED") {
      throw new BusinessError("VEHICLE_RETIRED", "Cannot open maintenance on a retired vehicle");
    }

    const log = await tx.maintenanceLog.create({
      data: {
        vehicleId: input.vehicleId,
        type: input.type,
        cost: input.cost,
        notes: input.notes,
        status: "ACTIVE",
      },
    });

    await tx.vehicle.update({ where: { id: input.vehicleId }, data: { status: "IN_SHOP" } });

    return log;
  });
}

export async function closeMaintenance(logId: string) {
  return prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.findUnique({ where: { id: logId }, include: { vehicle: true } });
    if (!log) throw new BusinessError("MAINTENANCE_NOT_FOUND", "Maintenance log not found");
    if (log.status === "COMPLETED") {
      throw new BusinessError("ALREADY_CLOSED", "Maintenance log is already closed");
    }

    const updatedLog = await tx.maintenanceLog.update({
      where: { id: logId },
      data: { status: "COMPLETED", closedAt: new Date() },
    });

    if (log.vehicle.status !== "RETIRED") {
      await tx.vehicle.update({ where: { id: log.vehicleId }, data: { status: "AVAILABLE" } });
    }

    return updatedLog;
  });
}

export async function deleteMaintenance(logId: string) {
  return prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.findUnique({ where: { id: logId }, include: { vehicle: true } });
    if (!log) throw new BusinessError("MAINTENANCE_NOT_FOUND", "Maintenance log not found");

    await tx.maintenanceLog.delete({ where: { id: logId } });

    if (log.status === "ACTIVE" && log.vehicle.status === "IN_SHOP") {
      const otherActive = await tx.maintenanceLog.findFirst({
        where: { vehicleId: log.vehicleId, status: "ACTIVE" },
      });
      if (!otherActive) {
        await tx.vehicle.update({ where: { id: log.vehicleId }, data: { status: "AVAILABLE" } });
      }
    }
  });
}
