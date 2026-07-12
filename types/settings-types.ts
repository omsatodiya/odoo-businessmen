import { z } from "zod";
import { Role } from "@prisma/client";

export const CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_LABELS: Record<Currency, string> = {
  INR: "INR (₹)",
  USD: "USD ($)",
  EUR: "EUR (€)",
  GBP: "GBP (£)",
};

export const DISTANCE_UNITS = ["Kilometers", "Miles"] as const;
export type DistanceUnit = (typeof DISTANCE_UNITS)[number];

export const updateSettingsSchema = z.object({
  depotName: z.string().trim().min(1, "Depot name is required").max(120, "Depot name is too long"),
  currency: z.enum(CURRENCIES, { message: "Invalid currency" }),
  distanceUnit: z.enum(DISTANCE_UNITS, { message: "Invalid distance unit" }),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

// --- RBAC matrix editing ---
// Only these 5 resources are editable from the Settings screen — Settings
// and Dashboard access are never accepted here (see lib/rbac.ts's
// setRbacMatrix, which is what structurally enforces this, not this schema
// alone). Keep this list in sync with lib/rbac.ts's EDITABLE_RESOURCES.

const accessLevelSchema = z.enum(["NONE", "VIEW", "FULL"]);

const editableRoleAccessSchema = z
  .object({
    FLEET: accessLevelSchema,
    DRIVERS: accessLevelSchema,
    TRIPS: accessLevelSchema,
    FUEL_EXPENSES: accessLevelSchema,
    ANALYTICS: accessLevelSchema,
  })
  .strict();

export const updateRbacMatrixSchema = z
  .object({
    [Role.FLEET_MANAGER]: editableRoleAccessSchema,
    [Role.DISPATCHER]: editableRoleAccessSchema,
    [Role.SAFETY_OFFICER]: editableRoleAccessSchema,
    [Role.FINANCIAL_ANALYST]: editableRoleAccessSchema,
  })
  .strict();

export type UpdateRbacMatrixInput = z.infer<typeof updateRbacMatrixSchema>;
