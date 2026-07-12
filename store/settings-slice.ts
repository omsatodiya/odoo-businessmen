import { create } from "zustand";
import type { AppSettings } from "@prisma/client";

import type { RbacMatrix } from "@/lib/rbac";
import type { UpdateRbacMatrixInput, UpdateSettingsInput } from "@/types/settings-types";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

interface SettingsState {
  settings: AppSettings | null;
  rbacMatrix: RbacMatrix | null;
  loading: boolean;
  saving: boolean;
  savingRbac: boolean;
  error?: string;
  fetch: () => Promise<void>;
  update: (dto: UpdateSettingsInput) => Promise<void>;
  updateRbacMatrix: (dto: UpdateRbacMatrixInput) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  rbacMatrix: null,
  loading: false,
  saving: false,
  savingRbac: false,
  error: undefined,
  fetch: async () => {
    set({ loading: true, error: undefined });
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to load settings");
      }
      const { rbacMatrix, ...settings } = json.data;
      set({ settings, rbacMatrix, loading: false });
    } catch (err) {
      set({ error: errorMessage(err, "Failed to load settings"), loading: false });
    }
  },
  update: async (dto) => {
    set({ saving: true, error: undefined });
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to save settings");
      }
      const { rbacMatrix, ...settings } = json.data;
      set({ settings, rbacMatrix, saving: false });
    } catch (err) {
      const message = errorMessage(err, "Failed to save settings");
      set({ error: message, saving: false });
      throw new Error(message);
    }
  },
  updateRbacMatrix: async (dto) => {
    set({ savingRbac: true, error: undefined });
    try {
      const res = await fetch("/api/settings/rbac", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to save RBAC matrix");
      }
      set({ rbacMatrix: json.data.rbacMatrix, savingRbac: false });
    } catch (err) {
      const message = errorMessage(err, "Failed to save RBAC matrix");
      set({ error: message, savingRbac: false });
      throw new Error(message);
    }
  },
}));
