import { create } from "zustand";
import type { AppSettings } from "@prisma/client";

import type { UpdateSettingsInput } from "@/types/settings-types";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

interface SettingsState {
  settings: AppSettings | null;
  loading: boolean;
  saving: boolean;
  error?: string;
  fetch: () => Promise<void>;
  update: (dto: UpdateSettingsInput) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loading: false,
  saving: false,
  error: undefined,
  fetch: async () => {
    set({ loading: true, error: undefined });
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to load settings");
      }
      set({ settings: json.data, loading: false });
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
      set({ settings: json.data, saving: false });
    } catch (err) {
      const message = errorMessage(err, "Failed to save settings");
      set({ error: message, saving: false });
      throw new Error(message);
    }
  },
}));
