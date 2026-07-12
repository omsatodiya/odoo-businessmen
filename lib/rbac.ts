import type { Role } from "@prisma/client";

import { BusinessError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export type Resource =
  | "FLEET"
  | "DRIVERS"
  | "TRIPS"
  | "FUEL_EXPENSES"
  | "ANALYTICS"
  | "SETTINGS"
  | "DASHBOARD";

export type Access = "NONE" | "VIEW" | "FULL";

export type RbacMatrix = Record<Role, Record<Resource, Access>>;

/** The 5 resources editable from the Settings & RBAC screen. Settings and
 * Dashboard access are intentionally never editable — see setRbacMatrix(). */
export const EDITABLE_RESOURCES = ["FLEET", "DRIVERS", "TRIPS", "FUEL_EXPENSES", "ANALYTICS"] as const satisfies readonly Resource[];

/**
 * Factory-default RBAC, mirrored from the Settings & RBAC screen (wireframe
 * 8). This is the fallback used to seed the database and to fill in any gaps
 * — it is NOT read directly by the app anymore; call getRbacMatrix() instead.
 */
export const DEFAULT_RBAC_MATRIX: RbacMatrix = {
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

/** Access level a role has on a resource, given a resolved matrix. */
export function accessFor(matrix: RbacMatrix, role: Role, resource: Resource): Access {
  return matrix[role][resource];
}

/** Whether a role satisfies at least `need` access on `resource`, given a resolved matrix. */
export function can(matrix: RbacMatrix, role: Role, resource: Resource, need: "VIEW" | "FULL"): boolean {
  const level = accessFor(matrix, role, resource);
  if (level === "NONE") return false;
  return need === "VIEW" ? true : level === "FULL";
}

// --- DB-backed matrix, editable from Settings & RBAC ---
//
// Cached in-memory per server process. Correct for this app's single-process
// local deployment; a multi-instance production deployment would need a
// shared cache (e.g. Redis) instead of a module-level variable.
let cachedMatrix: RbacMatrix | null = null;

function isAccess(value: unknown): value is Access {
  return value === "NONE" || value === "VIEW" || value === "FULL";
}

/** Merges a raw DB value onto the default matrix, ignoring anything malformed. */
function hydrateMatrix(raw: unknown): RbacMatrix {
  const result: RbacMatrix = structuredClone(DEFAULT_RBAC_MATRIX);
  if (!raw || typeof raw !== "object") return result;

  for (const role of Object.keys(result) as Role[]) {
    const rawRole = (raw as Record<string, unknown>)[role];
    if (!rawRole || typeof rawRole !== "object") continue;

    for (const resource of Object.keys(result[role]) as Resource[]) {
      const value = (rawRole as Record<string, unknown>)[resource];
      if (isAccess(value)) {
        result[role][resource] = value;
      }
    }
  }

  return result;
}

/** Current effective RBAC matrix — DB-backed, falls back to defaults, cached per process. */
export async function getRbacMatrix(): Promise<RbacMatrix> {
  if (cachedMatrix) return cachedMatrix;

  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  cachedMatrix = hydrateMatrix(settings?.rbacMatrix);
  return cachedMatrix;
}

export type EditableRoleAccess = Record<(typeof EDITABLE_RESOURCES)[number], Access>;
export type EditableMatrixUpdate = Record<Role, EditableRoleAccess>;

/**
 * Persists an update to the 5 editable resources only — Settings and
 * Dashboard access are carried over unchanged from the current matrix,
 * regardless of what's passed in. This is what makes it structurally
 * impossible for a Fleet Manager to lock themselves out of this editor:
 * FLEET_MANAGER.SETTINGS can never be touched by this function.
 */
export async function setRbacMatrix(update: EditableMatrixUpdate): Promise<RbacMatrix> {
  const current = await getRbacMatrix();
  const next: RbacMatrix = structuredClone(current);

  for (const role of Object.keys(next) as Role[]) {
    for (const resource of EDITABLE_RESOURCES) {
      next[role][resource] = update[role][resource];
    }
  }

  // Defense in depth — this invariant should be unreachable given the
  // shape above, but never persist a matrix that would lock every Fleet
  // Manager out of the RBAC editor.
  if (next.FLEET_MANAGER.SETTINGS !== "FULL") {
    throw new BusinessError("RBAC_LOCKOUT", "Fleet Manager must always retain full Settings access");
  }

  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    update: { rbacMatrix: next },
    create: { id: "singleton", rbacMatrix: next },
  });

  cachedMatrix = next;
  return next;
}
