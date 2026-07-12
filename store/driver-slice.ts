import { create } from "zustand";
import type { Driver } from "@prisma/client";

export interface DriverWithCompletion extends Driver {
  tripCompletionRate: number;
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
  create: (dto: any) => Promise<void>;
  update: (id: string, dto: any) => Promise<void>;
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
    } catch (err: any) {
      set({ error: err.message || "Failed to load drivers", loading: false });
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
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
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
    } catch (err: any) {
      set({ error: err.message, loading: false });
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
    get().fetch();
  },
}));
