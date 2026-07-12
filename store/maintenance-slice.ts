import { create } from "zustand";
import { MaintenanceLog, Vehicle } from "@prisma/client";
import { CreateMaintenanceInput } from "@/types/maintenance";

export type MaintenanceLogWithVehicle = MaintenanceLog & {
  vehicle: Vehicle;
};

interface MaintenanceState {
  items: MaintenanceLogWithVehicle[];
  loading: boolean;
  error?: string;
  fetch: () => Promise<void>;
  open: (dto: CreateMaintenanceInput) => Promise<void>;
  closeLog: (logId: string) => Promise<void>;
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  items: [],
  loading: false,
  error: undefined,
  fetch: async () => {
    set({ loading: true, error: undefined });
    try {
      const res = await fetch("/api/maintenance");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to fetch maintenance logs");
      }

      set({ items: json.data, loading: false });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: errorMsg, loading: false });
    }
  },
  open: async (dto) => {
    set({ loading: true, error: undefined });
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      const json = await res.json();

      if (!res.ok) {
        const err = new Error(json.error?.message || "Failed to open maintenance log") as Error & {
          details?: unknown;
        };
        err.details = json.error?.details;
        throw err;
      }

      await get().fetch();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: errorMsg, loading: false });
      throw err;
    }
  },
  closeLog: async (logId) => {
    set({ loading: true, error: undefined });
    try {
      const res = await fetch(`/api/maintenance/${logId}/close`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok) {
        const err = new Error(json.error?.message || "Failed to close maintenance log") as Error & {
          details?: unknown;
        };
        err.details = json.error?.details;
        throw err;
      }

      await get().fetch();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: errorMsg, loading: false });
      throw err;
    }
  },
}));
