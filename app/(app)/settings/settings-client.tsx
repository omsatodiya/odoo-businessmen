"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AppSettings, Role } from "@prisma/client";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { can, EDITABLE_RESOURCES, type Access, type RbacMatrix } from "@/lib/rbac";
import { useSettingsStore } from "@/store/settings-slice";
import {
  CURRENCIES,
  CURRENCY_LABELS,
  DISTANCE_UNITS,
  type Currency,
  type DistanceUnit,
  type UpdateRbacMatrixInput,
} from "@/types/settings-types";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<Role, string> = {
  FLEET_MANAGER: "Fleet Manager",
  DISPATCHER: "Dispatcher",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};

const ROLE_ORDER: Role[] = ["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"];

const RESOURCE_LABELS: Record<(typeof EDITABLE_RESOURCES)[number], string> = {
  FLEET: "Fleet",
  DRIVERS: "Drivers",
  TRIPS: "Trips",
  FUEL_EXPENSES: "Fuel/Exp.",
  ANALYTICS: "Analytics",
};

const ACCESS_OPTIONS: Access[] = ["NONE", "VIEW", "FULL"];

const ACCESS_DISPLAY: Record<Access, string> = {
  FULL: "✓",
  VIEW: "view",
  NONE: "—",
};

const ACCESS_STYLE: Record<Access, string> = {
  FULL: "text-foreground",
  VIEW: "text-muted-foreground",
  NONE: "text-muted-foreground/60",
};

export function SettingsClient({ role }: { role: Role }) {
  const { settings, rbacMatrix, loading, error, fetch } = useSettingsStore();
  const canEdit = rbacMatrix ? can(rbacMatrix, role, "SETTINGS", "FULL") : false;

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & RBAC"
        description="Depot configuration and role-based access control."
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <div>
          <h2 className="mb-2 text-base font-semibold text-foreground">General</h2>
          {loading && !settings ? (
            <div className="border border-border bg-card p-4 text-sm text-muted-foreground">
              Loading settings...
            </div>
          ) : settings ? (
            <GeneralSettingsForm settings={settings} canEdit={canEdit} />
          ) : null}
        </div>

        <div>
          <h2 className="mb-2 text-base font-semibold text-foreground">Role-Based Access (RBAC)</h2>
          {loading && !rbacMatrix ? (
            <div className="border border-border bg-card p-4 text-sm text-muted-foreground">
              Loading RBAC matrix...
            </div>
          ) : rbacMatrix ? (
            <RbacMatrixEditor matrix={rbacMatrix} canEdit={canEdit} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Only mounts once `settings` has loaded, so local field state can
 * initialize directly from props via useState — no effect needed to sync
 * an async-loaded value into local editable state.
 */
function GeneralSettingsForm({ settings, canEdit }: { settings: AppSettings; canEdit: boolean }) {
  const update = useSettingsStore((state) => state.update);

  const [depotName, setDepotName] = useState(settings.depotName);
  const [currency, setCurrency] = useState<Currency>(settings.currency as Currency);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(settings.distanceUnit as DistanceUnit);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const trimmed = depotName.trim();
    if (!trimmed) newErrors.depotName = "Depot name is required";
    else if (trimmed.length > 120) newErrors.depotName = "Depot name is too long";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit) return;
    if (!validate()) return;

    setIsSaving(true);
    try {
      await update({ depotName: depotName.trim(), currency, distanceUnit });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-border bg-card p-4">
      <div className="space-y-1">
        <Label htmlFor="depotName">Depot Name</Label>
        <Input
          id="depotName"
          value={depotName}
          onChange={(event) => setDepotName(event.target.value)}
          disabled={!canEdit}
          className="h-9"
        />
        {errors.depotName ? <p className="text-xs text-destructive">{errors.depotName}</p> : null}
      </div>

      <div className="space-y-1">
        <Label htmlFor="currency">Currency</Label>
        <Select
          value={currency}
          onValueChange={(value) => setCurrency(value as Currency)}
          disabled={!canEdit}
        >
          <SelectTrigger id="currency" className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((value) => (
              <SelectItem key={value} value={value}>
                {CURRENCY_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="distanceUnit">Distance Unit</Label>
        <Select
          value={distanceUnit}
          onValueChange={(value) => setDistanceUnit(value as DistanceUnit)}
          disabled={!canEdit}
        >
          <SelectTrigger id="distanceUnit" className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DISTANCE_UNITS.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {canEdit ? (
        <Button type="submit" disabled={isSaving} className="w-full">
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">Only Fleet Managers can edit these settings.</p>
      )}
    </form>
  );
}

/**
 * Same mount-once-data-is-ready pattern as GeneralSettingsForm — local
 * pending-edit state initializes from the loaded matrix via useState, no
 * effect required.
 */
function RbacMatrixEditor({ matrix, canEdit }: { matrix: RbacMatrix; canEdit: boolean }) {
  const router = useRouter();
  const updateRbacMatrix = useSettingsStore((state) => state.updateRbacMatrix);
  const [pending, setPending] = useState<RbacMatrix>(() => structuredClone(matrix));
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = ROLE_ORDER.some((roleKey) =>
    EDITABLE_RESOURCES.some((resource) => pending[roleKey][resource] !== matrix[roleKey][resource])
  );

  const setCell = (roleKey: Role, resource: (typeof EDITABLE_RESOURCES)[number], value: Access) => {
    setPending((prev) => ({
      ...prev,
      [roleKey]: { ...prev[roleKey], [resource]: value },
    }));
  };

  const handleDiscard = () => setPending(structuredClone(matrix));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = ROLE_ORDER.reduce((acc, roleKey) => {
        acc[roleKey] = {
          FLEET: pending[roleKey].FLEET,
          DRIVERS: pending[roleKey].DRIVERS,
          TRIPS: pending[roleKey].TRIPS,
          FUEL_EXPENSES: pending[roleKey].FUEL_EXPENSES,
          ANALYTICS: pending[roleKey].ANALYTICS,
        };
        return acc;
      }, {} as UpdateRbacMatrixInput);

      await updateRbacMatrix(payload);
      toast.success("RBAC matrix saved — changes apply immediately across the app.");
      // Re-render this session's server components (sidebar included) now,
      // so the effect is visible immediately instead of on the next
      // navigation only.
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save RBAC matrix");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto border border-border bg-card">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-2 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Role
              </th>
              {EDITABLE_RESOURCES.map((resource) => (
                <th
                  key={resource}
                  className="px-4 py-2 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
                >
                  {RESOURCE_LABELS[resource]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLE_ORDER.map((roleKey) => (
              <tr key={roleKey} className="border-b border-border last:border-0">
                <td className="px-4 py-2 font-medium text-foreground">{ROLE_LABELS[roleKey]}</td>
                {EDITABLE_RESOURCES.map((resource) => {
                  const access = pending[roleKey][resource];
                  return (
                    <td key={resource} className="px-2 py-1.5">
                      {canEdit ? (
                        <Select
                          value={access}
                          onValueChange={(value) => setCell(roleKey, resource, value as Access)}
                        >
                          <SelectTrigger className="h-8 w-[92px] font-mono text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACCESS_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option} className="font-mono text-xs">
                                {ACCESS_DISPLAY[option]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={cn("px-2 font-mono", ACCESS_STYLE[access])}>
                          {ACCESS_DISPLAY[access]}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canEdit ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Settings and Dashboard access aren&apos;t editable here — this keeps Fleet Manager from ever
            locking itself out of this screen.
          </p>
          <div className="flex items-center gap-2">
            {isDirty ? (
              <Button type="button" variant="outline" size="sm" onClick={handleDiscard} disabled={isSaving}>
                Discard
              </Button>
            ) : null}
            <Button type="button" size="sm" onClick={handleSave} disabled={!isDirty || isSaving}>
              {isSaving ? "Saving..." : "Save RBAC changes"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
