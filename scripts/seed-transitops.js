/**
 * Resets and reseeds the TransitOps demo dataset. Safe to re-run — it wipes
 * app tables (children first, FK-safe order) before inserting fresh data.
 *
 * Usage: pnpm db:seed
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Keep these emails in sync with DEMO_ROLE_EMAILS in
// components/auth/login-form.tsx — the login page's Role dropdown prefills
// exactly these addresses.
const DEMO_PASSWORD = "Password123!";

const USERS = [
  { email: "fleet.manager@transitops.in", name: "Priya Fleet", role: "FLEET_MANAGER" },
  { email: "raven.k@transitops.in", name: "Raven K.", role: "DISPATCHER" },
  { email: "safety.officer@transitops.in", name: "Aisha Safety", role: "SAFETY_OFFICER" },
  { email: "finance.analyst@transitops.in", name: "Karan Finance", role: "FINANCIAL_ANALYST" },
];

async function wipe() {
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await prisma.user.createMany({
    data: USERS.map((user) => ({ ...user, password: passwordHash })),
  });
}

async function seedSettings() {
  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      depotName: "Gandhinagar Depot GJ-14",
      currency: "INR",
      distanceUnit: "Kilometers",
    },
  });
}

async function seedVehicles() {
  const vehicles = await prisma.$transaction(
    [
      { regNo: "GJ01AB452", name: "VAN-05", type: "VAN", capacityKg: 500, odometer: 74000, acquisitionCost: 620000, status: "AVAILABLE", region: "Gandhinagar" },
      { regNo: "GJ01AB998", name: "TRUCK-11", type: "TRUCK", capacityKg: 5000, odometer: 182000, acquisitionCost: 2450000, status: "ON_TRIP", region: "Ahmedabad" },
      { regNo: "GJ01AB1120", name: "MINI-03", type: "MINI", capacityKg: 1000, odometer: 66000, acquisitionCost: 410000, status: "IN_SHOP", region: "Sanand" },
      { regNo: "GJ01AB008", name: "VAN-09", type: "VAN", capacityKg: 750, odometer: 241900, acquisitionCost: 590000, status: "RETIRED", region: "Gandhinagar" },
      { regNo: "GJ01AB776", name: "TRUCK-04", type: "TRUCK", capacityKg: 6000, odometer: 95000, acquisitionCost: 2100000, status: "AVAILABLE", region: "Vatva" },
      { regNo: "GJ01AB331", name: "MINI-08", type: "MINI", capacityKg: 800, odometer: 41000, acquisitionCost: 380000, status: "AVAILABLE", region: "Kalol" },
    ].map((data) => prisma.vehicle.create({ data }))
  );

  return Object.fromEntries(vehicles.map((v) => [v.name, v]));
}

async function seedDrivers() {
  const drivers = await prisma.$transaction(
    [
      { name: "Alex", licenseNo: "DL-88213", licenseCategory: "LMV", licenseExpiry: new Date("2028-12-01"), contact: "9876543210", safetyScore: 96, status: "AVAILABLE" },
      { name: "John", licenseNo: "DL-44120", licenseCategory: "HMV", licenseExpiry: new Date("2025-03-01"), contact: "9822012345", safetyScore: 81, status: "SUSPENDED" },
      { name: "Priya", licenseNo: "DL-77031", licenseCategory: "LMV", licenseExpiry: new Date("2027-08-01"), contact: "9911098765", safetyScore: 99, status: "ON_TRIP" },
      { name: "Suresh", licenseNo: "DL-90045", licenseCategory: "HMV", licenseExpiry: new Date("2027-01-01"), contact: "9744055555", safetyScore: 88, status: "OFF_DUTY" },
      { name: "Meera", licenseNo: "DL-55210", licenseCategory: "LMV", licenseExpiry: new Date("2026-11-01"), contact: "9001122334", safetyScore: 92, status: "AVAILABLE" },
    ].map((data) => prisma.driver.create({ data }))
  );

  return Object.fromEntries(drivers.map((d) => [d.name, d]));
}

async function seedMaintenance(vehicles) {
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: vehicles["MINI-03"].id,
      type: "Oil Change",
      cost: 2500,
      status: "ACTIVE",
    },
  });

  await prisma.maintenanceLog.create({
    data: {
      vehicleId: vehicles["TRUCK-11"].id,
      type: "Engine Repair",
      cost: 18000,
      status: "COMPLETED",
      openedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      closedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
  });
}

async function seedTripsAndLogs(vehicles, drivers) {
  // TR001 — currently dispatched: TRUCK-11 + Priya are both ON_TRIP.
  const tr001 = await prisma.trip.create({
    data: {
      code: "TR001",
      source: "Gandhinagar Depot",
      destination: "Ahmedabad Hub",
      cargoWeightKg: 4500,
      plannedDistanceKm: 38,
      vehicleId: vehicles["TRUCK-11"].id,
      driverId: drivers["Priya"].id,
      status: "DISPATCHED",
      dispatchedAt: new Date(Date.now() - 45 * 60 * 1000),
      startOdometer: 182000,
    },
  });
  await prisma.expense.create({
    data: { vehicleId: vehicles["TRUCK-11"].id, tripId: tr001.id, type: "TOLL", amount: 120 },
  });

  // TR002 — completed: VAN-05 + Alex, both back to AVAILABLE.
  const tr002 = await prisma.trip.create({
    data: {
      code: "TR002",
      source: "Ahmedabad Hub",
      destination: "Gandhinagar Depot",
      cargoWeightKg: 380,
      plannedDistanceKm: 42,
      vehicleId: vehicles["VAN-05"].id,
      driverId: drivers["Alex"].id,
      status: "COMPLETED",
      dispatchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      startOdometer: 73600,
      endOdometer: 74000,
      fuelConsumedL: 32,
      revenue: 8500,
    },
  });
  await prisma.fuelLog.create({
    data: { vehicleId: vehicles["VAN-05"].id, tripId: tr002.id, liters: 32, cost: 3350 },
  });

  // TR003 — completed: MINI-08 + Meera, both back to AVAILABLE.
  const tr003 = await prisma.trip.create({
    data: {
      code: "TR003",
      source: "Kalol Depot",
      destination: "Sanand Warehouse",
      cargoWeightKg: 300,
      plannedDistanceKm: 90,
      vehicleId: vehicles["MINI-08"].id,
      driverId: drivers["Meera"].id,
      status: "COMPLETED",
      dispatchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
      startOdometer: 40900,
      endOdometer: 41000,
      fuelConsumedL: 9,
      revenue: 3200,
    },
  });
  await prisma.fuelLog.create({
    data: { vehicleId: vehicles["MINI-08"].id, tripId: tr003.id, liters: 9, cost: 940 },
  });

  // TR004 — draft, not yet dispatched.
  await prisma.trip.create({
    data: {
      code: "TR004",
      source: "Vatva Industrial Area",
      destination: "Sanand Warehouse",
      cargoWeightKg: 5200,
      plannedDistanceKm: 55,
      vehicleId: vehicles["TRUCK-04"].id,
      driverId: drivers["Meera"].id,
      status: "DRAFT",
    },
  });

  // TR005 — cancelled historical trip.
  await prisma.trip.create({
    data: {
      code: "TR005",
      source: "Mansa",
      destination: "Kalol Depot",
      cargoWeightKg: 200,
      plannedDistanceKm: 30,
      vehicleId: vehicles["VAN-09"].id,
      driverId: drivers["John"].id,
      status: "CANCELLED",
      cancelledReason: "Vehicle sent to shop",
    },
  });

  // Routine refuel, not tied to a specific trip.
  await prisma.fuelLog.create({
    data: { vehicleId: vehicles["TRUCK-11"].id, liters: 150, cost: 13500 },
  });
}

async function main() {
  await wipe();
  await seedSettings();
  await seedUsers();
  const vehicles = await seedVehicles();
  const drivers = await seedDrivers();
  await seedMaintenance(vehicles);
  await seedTripsAndLogs(vehicles, drivers);

  console.log("\nSeed complete.\n");
  console.log("Demo logins (shared password: %s)", DEMO_PASSWORD);
  for (const user of USERS) {
    console.log(`  ${user.role.padEnd(18)} ${user.email}`);
  }
  console.log("");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
