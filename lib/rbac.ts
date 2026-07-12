import type { Role } from "@prisma/client";

export type Resource =
  | "FLEET"
  | "DRIVERS"
  | "TRIPS"
  | "FUEL_EXPENSES"
  | "ANALYTICS"
  | "SETTINGS"
  | "DASHBOARD";

export type Access = "NONE" | "VIEW" | "FULL";

/**
 * Single source of truth for RBAC, mirrored from the Settings & RBAC screen
 * (wireframe 8). FLEET covers both Vehicle Registry and Maintenance.
 */
export const RBAC_MATRIX: Record<Role, Record<Resource, Access>> = {
  FLEET_MANAGER: {
    FLEET: "FULL",
    DRIVERS: "FULL",
    TRIPS: "NONE",
    FUEL_EXPENSES: "NONE",
    ANALYTICS: "FULL",
    SETTINGS: "FULL",
    DASHBOARD: "FULL",
  },
  DISPATCHER: {
    FLEET: "VIEW",
    DRIVERS: "NONE",
    TRIPS: "FULL",
    FUEL_EXPENSES: "NONE",
    ANALYTICS: "NONE",
    SETTINGS: "VIEW",
    DASHBOARD: "FULL",
  },
  SAFETY_OFFICER: {
    FLEET: "NONE",
    DRIVERS: "FULL",
    TRIPS: "VIEW",
    FUEL_EXPENSES: "NONE",
    ANALYTICS: "NONE",
    SETTINGS: "VIEW",
    DASHBOARD: "FULL",
  },
  FINANCIAL_ANALYST: {
    FLEET: "VIEW",
    DRIVERS: "NONE",
    TRIPS: "NONE",
    FUEL_EXPENSES: "FULL",
    ANALYTICS: "FULL",
    SETTINGS: "VIEW",
    DASHBOARD: "FULL",
  },
};

/** Access level a role has on a resource. */
export function accessFor(role: Role, resource: Resource): Access {
  return RBAC_MATRIX[role][resource];
}

/** Whether a role satisfies at least `need` access on `resource`. */
export function can(role: Role, resource: Resource, need: "VIEW" | "FULL"): boolean {
  const level = accessFor(role, resource);
  if (level === "NONE") return false;
  return need === "VIEW" ? true : level === "FULL";
}
