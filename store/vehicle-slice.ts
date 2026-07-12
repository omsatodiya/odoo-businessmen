import { create } from "zustand";
import { Vehicle } from "@prisma/client";
import { CreateVehicleInput, UpdateVehicleInput } from "@/types/vehicle";

interface VehicleState {
  items: Vehicle[];
  loading: boolean;
  error?: string;
  filters: {
    q: string;
    type: string;
    status: string;
  };
  fetch: () => Promise<void>;
  create: (dto: CreateVehicleInput) => Promise<void>;
  update: (id: string, dto: UpdateVehicleInput) => Promise<void>;
  setFilter: (key: "q" | "type" | "status", value: string) => void;
}

export const useVehicleStore = create<VehicleState>((set, get) => ({
  items: [],
  loading: false,
  error: undefined,
  filters: {
    q: "",
    type: "",
    status: "",
  },
  fetch: async () => {
    set({ loading: true, error: undefined });
    try {
      const { q, type, status } = get().filters;
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (type) params.set("type", type);
      if (status) params.set("status", status);

      const res = await fetch(`/api/vehicles?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to fetch vehicles");
      }

      set({ items: json.data, loading: false });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: errorMsg, loading: false });
    }
  },
  create: async (dto) => {
    set({ loading: true, error: undefined });
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      const json = await res.json();

      if (!res.ok) {
        const err = new Error(json.error?.message || "Failed to create vehicle") as Error & {
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
  update: async (id, dto) => {
    set({ loading: true, error: undefined });
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      const json = await res.json();

      if (!res.ok) {
        const err = new Error(json.error?.message || "Failed to update vehicle") as Error & {
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
  setFilter: (key, value) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    }));
    void get().fetch();
  },
}));
