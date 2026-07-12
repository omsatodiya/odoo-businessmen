import { create } from "zustand";
import type { Driver } from "@prisma/client";

import type { DriverInput, UpdateDriverInput } from "@/types/driver-types";

export interface DriverWithCompletion extends Driver {
  tripCompletionRate: number;
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export interface DriverState {
  items: DriverWithCompletion[];
  loading: boolean;
  error?: string;
  filters: {
    status: string;
    q: string;
  };
  fetch: () => Promise<void>;
  create: (dto: DriverInput) => Promise<void>;
  update: (id: string, dto: UpdateDriverInput) => Promise<void>;
  setFilter: (key: string, value: string) => void;
}

export const useDriverStore = create<DriverState>((set, get) => ({
  items: [],
  loading: false,
  error: undefined,
  filters: {
    status: "ALL",
    q: "",
  },
  fetch: async () => {
    set({ loading: true, error: undefined });
    try {
      const { status, q } = get().filters;
      const params = new URLSearchParams();
      if (status && status !== "ALL") params.append("status", status);
      if (q) params.append("q", q);

      const res = await fetch(`/api/drivers?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to fetch drivers");
      }
      const json = await res.json();
      set({ items: json.data, loading: false });
    } catch (err) {
      set({ error: errorMessage(err, "Failed to load drivers"), loading: false });
    }
  },
  create: async (dto) => {
    set({ loading: true, error: undefined });
    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to create driver");
      }
      await get().fetch();
    } catch (err) {
      const message = errorMessage(err, "Failed to create driver");
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },
  update: async (id, dto) => {
    set({ loading: true, error: undefined });
    try {
      const res = await fetch(`/api/drivers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to update driver");
      }
      await get().fetch();
    } catch (err) {
      const message = errorMessage(err, "Failed to update driver");
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },
  setFilter: (key, value) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    }));
    get().fetch();
  },
}));
