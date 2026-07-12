"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
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
import { can, RBAC_MATRIX, type Access, type Resource } from "@/lib/rbac";
import { useSettingsStore } from "@/store/settings-slice";
import {
  CURRENCIES,
  CURRENCY_LABELS,
  DISTANCE_UNITS,
  type Currency,
  type DistanceUnit,
} from "@/types/settings-types";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<Role, string> = {
  FLEET_MANAGER: "Fleet Manager",
  DISPATCHER: "Dispatcher",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};

const ROLE_ORDER: Role[] = ["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"];

const MATRIX_RESOURCES: { key: Resource; label: string }[] = [
  { key: "FLEET", label: "Fleet" },
  { key: "DRIVERS", label: "Drivers" },
  { key: "TRIPS", label: "Trips" },
  { key: "FUEL_EXPENSES", label: "Fuel/Exp." },
  { key: "ANALYTICS", label: "Analytics" },
];

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
  const { settings, loading, error, fetch } = useSettingsStore();
  const canEdit = can(role, "SETTINGS", "FULL");

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
          <AlertTitle>Could not load settings</AlertTitle>
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
          <div className="overflow-x-auto border border-border bg-card">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Role
                  </th>
                  {MATRIX_RESOURCES.map((resource) => (
                    <th
                      key={resource.key}
                      className="px-4 py-2 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
                    >
                      {resource.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROLE_ORDER.map((roleKey) => (
                  <tr key={roleKey} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">{ROLE_LABELS[roleKey]}</td>
                    {MATRIX_RESOURCES.map((resource) => {
                      const access = RBAC_MATRIX[roleKey][resource.key];
                      return (
                        <td key={resource.key} className={cn("px-4 py-2.5 font-mono", ACCESS_STYLE[access])}>
                          {ACCESS_DISPLAY[access]}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
