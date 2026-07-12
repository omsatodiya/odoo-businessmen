import { prisma } from "@/lib/prisma";

function toNumber(value: unknown): number {
  return value === null || value === undefined ? 0 : Number(value);
}

/** Sum of (endOdometer - startOdometer) and fuelConsumedL across a vehicle's completed trips. */
async function tripTotals(vehicleId: string) {
  const trips = await prisma.trip.findMany({
    where: { vehicleId, status: "COMPLETED" },
    select: { startOdometer: true, endOdometer: true, fuelConsumedL: true, revenue: true },
  });

  return trips.reduce(
    (acc, trip) => {
      const distance = trip.startOdometer !== null && trip.endOdometer !== null ? trip.endOdometer - trip.startOdometer : 0;
      return {
        distanceKm: acc.distanceKm + distance,
        fuelLiters: acc.fuelLiters + (trip.fuelConsumedL ?? 0),
        revenue: acc.revenue + toNumber(trip.revenue),
      };
    },
    { distanceKm: 0, fuelLiters: 0, revenue: 0 }
  );
}

/** Fuel efficiency in km/L from completed trips. Null if no fuel data yet. */
export async function fuelEfficiency(vehicleId: string): Promise<number | null> {
  const { distanceKm, fuelLiters } = await tripTotals(vehicleId);
  if (fuelLiters <= 0) return null;
  return distanceKm / fuelLiters;
}

/**
 * Fuel (FuelLog) + maintenance (MaintenanceLog) + non-maintenance expenses
 * (Expense, excluding type MAINTENANCE to avoid double-counting maintenance
 * cost already captured via MaintenanceLog.cost).
 */
export async function operationalCost(vehicleId: string): Promise<number> {
  const [fuelSum, maintenanceSum, expenseSum] = await Promise.all([
    prisma.fuelLog.aggregate({ where: { vehicleId }, _sum: { cost: true } }),
    prisma.maintenanceLog.aggregate({ where: { vehicleId }, _sum: { cost: true } }),
    prisma.expense.aggregate({ where: { vehicleId, type: { not: "MAINTENANCE" } }, _sum: { amount: true } }),
  ]);

  return toNumber(fuelSum._sum.cost) + toNumber(maintenanceSum._sum.cost) + toNumber(expenseSum._sum.amount);
}

/** (Revenue - operationalCost) / acquisitionCost * 100. Null if the vehicle has no acquisition cost on file. */
export async function vehicleRoi(vehicleId: string): Promise<number | null> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { acquisitionCost: true } });
  const acquisitionCost = toNumber(vehicle?.acquisitionCost);
  if (acquisitionCost <= 0) return null;

  const [{ revenue }, cost] = await Promise.all([tripTotals(vehicleId), operationalCost(vehicleId)]);
  return ((revenue - cost) / acquisitionCost) * 100;
}

/** % of non-retired vehicles currently on a trip. */
export async function fleetUtilization(): Promise<number> {
  const [total, onTrip, retired] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: "ON_TRIP" } }),
    prisma.vehicle.count({ where: { status: "RETIRED" } }),
  ]);

  const activeFleet = total - retired;
  if (activeFleet <= 0) return 0;
  return (onTrip / activeFleet) * 100;
}

export interface VehicleAnalytics {
  vehicleId: string;
  regNo: string;
  name: string;
  distanceKm: number;
  fuelLiters: number;
  fuelEfficiencyKmPerL: number | null;
  operationalCost: number;
  revenue: number;
  roiPercent: number | null;
}

/** Per-vehicle analytics for the Analytics page's "Top Costliest Vehicles" list and CSV export. */
export async function getAllVehicleAnalytics(): Promise<VehicleAnalytics[]> {
  const vehicles = await prisma.vehicle.findMany({ select: { id: true, regNo: true, name: true, acquisitionCost: true } });

  return Promise.all(
    vehicles.map(async (vehicle) => {
      const [{ distanceKm, fuelLiters, revenue }, cost] = await Promise.all([
        tripTotals(vehicle.id),
        operationalCost(vehicle.id),
      ]);

      const acquisitionCost = toNumber(vehicle.acquisitionCost);

      return {
        vehicleId: vehicle.id,
        regNo: vehicle.regNo,
        name: vehicle.name,
        distanceKm,
        fuelLiters,
        fuelEfficiencyKmPerL: fuelLiters > 0 ? distanceKm / fuelLiters : null,
        operationalCost: cost,
        revenue,
        roiPercent: acquisitionCost > 0 ? ((revenue - cost) / acquisitionCost) * 100 : null,
      };
    })
  );
}

/** Sum of completed-trip revenue grouped by "YYYY-MM", sorted chronologically. */
export async function getMonthlyRevenue(): Promise<{ month: string; revenue: number }[]> {
  const trips = await prisma.trip.findMany({
    where: { status: "COMPLETED", revenue: { not: null } },
    select: { completedAt: true, revenue: true },
  });

  const byMonth = new Map<string, number>();
  for (const trip of trips) {
    if (!trip.completedAt) continue;
    const key = `${trip.completedAt.getFullYear()}-${String(trip.completedAt.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + toNumber(trip.revenue));
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue }));
}
