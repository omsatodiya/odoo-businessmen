import { prisma } from "@/lib/prisma";
import { BusinessError } from "@/lib/errors";

export interface CreateTripInput {
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
}

export interface CompleteTripInput {
  endOdometer: number;
  fuelConsumedL?: number;
  revenue?: number;
}

/**
 * Vehicles/drivers eligible for a new dispatch. This is the single query
 * that enforces "Retired/In Shop vehicles and expired-license/Suspended/
 * On Trip drivers never appear in the dispatch pool" — the Trip creation
 * form's dropdowns MUST source from this, not a raw vehicle/driver list.
 */
export async function getDispatchOptions() {
  const [vehicles, drivers] = await Promise.all([
    prisma.vehicle.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { name: "asc" },
    }),
    prisma.driver.findMany({
      where: { status: "AVAILABLE", licenseExpiry: { gt: new Date() } },
      orderBy: { name: "asc" },
    }),
  ]);

  return { vehicles, drivers };
}

async function nextTripCode() {
  const count = await prisma.trip.count();
  return `TR${String(count + 1).padStart(3, "0")}`;
}

export async function createTrip(input: CreateTripInput) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) throw new BusinessError("VEHICLE_NOT_FOUND", "Vehicle not found");

  if (input.cargoWeightKg > vehicle.capacityKg) {
    throw new BusinessError(
      "CAPACITY_EXCEEDED",
      `Cargo weight ${input.cargoWeightKg} kg exceeds vehicle capacity of ${vehicle.capacityKg} kg`
    );
  }

  return prisma.trip.create({
    data: {
      code: await nextTripCode(),
      source: input.source,
      destination: input.destination,
      vehicleId: input.vehicleId,
      driverId: input.driverId,
      cargoWeightKg: input.cargoWeightKg,
      plannedDistanceKm: input.plannedDistanceKm,
      status: "DRAFT",
    },
  });
}

export async function dispatchTrip(tripId: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });
    if (!trip) throw new BusinessError("TRIP_NOT_FOUND", "Trip not found");
    if (trip.status !== "DRAFT") {
      throw new BusinessError("INVALID_STATE", `Only draft trips can be dispatched (current: ${trip.status})`);
    }
    if (trip.vehicle.status !== "AVAILABLE") {
      throw new BusinessError("VEHICLE_NOT_AVAILABLE", `Vehicle ${trip.vehicle.name} is not available`);
    }
    if (trip.driver.status !== "AVAILABLE") {
      throw new BusinessError("DRIVER_NOT_AVAILABLE", `Driver ${trip.driver.name} is not available`);
    }
    if (trip.driver.licenseExpiry <= new Date()) {
      throw new BusinessError("LICENSE_EXPIRED", `Driver ${trip.driver.name}'s license has expired`);
    }
    if (trip.cargoWeightKg > trip.vehicle.capacityKg) {
      throw new BusinessError(
        "CAPACITY_EXCEEDED",
        `Cargo weight ${trip.cargoWeightKg} kg exceeds vehicle capacity of ${trip.vehicle.capacityKg} kg`
      );
    }

    const [updatedTrip] = await Promise.all([
      tx.trip.update({
        where: { id: tripId },
        data: { status: "DISPATCHED", dispatchedAt: new Date(), startOdometer: trip.vehicle.odometer },
      }),
      tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "ON_TRIP" } }),
      tx.driver.update({ where: { id: trip.driverId }, data: { status: "ON_TRIP" } }),
    ]);

    return updatedTrip;
  });
}

/**
 * Sets the trip's own odometer/fuel/revenue fields. Does NOT create a
 * FuelLog row — Trip.fuelConsumedL is the operational record used for
 * per-trip efficiency; FuelLog is a separate financial/purchase record
 * (liters + cost + date) owned by the Fuel & Expenses module and may not
 * map 1:1 to a single trip.
 */
export async function completeTrip(tripId: string, input: CompleteTripInput) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId }, include: { vehicle: true } });
    if (!trip) throw new BusinessError("TRIP_NOT_FOUND", "Trip not found");
    if (trip.status !== "DISPATCHED") {
      throw new BusinessError("INVALID_STATE", `Only dispatched trips can be completed (current: ${trip.status})`);
    }
    if (trip.startOdometer !== null && input.endOdometer < trip.startOdometer) {
      throw new BusinessError("INVALID_ODOMETER", "End odometer cannot be less than the start odometer");
    }

    const [updatedTrip] = await Promise.all([
      tx.trip.update({
        where: { id: tripId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          endOdometer: input.endOdometer,
          fuelConsumedL: input.fuelConsumedL,
          revenue: input.revenue,
        },
      }),
      tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "AVAILABLE", odometer: input.endOdometer },
      }),
      tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } }),
    ]);

    return updatedTrip;
  });
}

export async function cancelTrip(tripId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new BusinessError("TRIP_NOT_FOUND", "Trip not found");
    if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
      throw new BusinessError("INVALID_STATE", `Trip is already ${trip.status.toLowerCase()}`);
    }

    const updatedTrip = await tx.trip.update({
      where: { id: tripId },
      data: { status: "CANCELLED", cancelledReason: reason },
    });

    if (trip.status === "DISPATCHED") {
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "AVAILABLE" } });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });
    }

    return updatedTrip;
  });
}
