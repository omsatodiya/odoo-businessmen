import { create } from "zustand";
import type { Trip, Vehicle, Driver } from "@prisma/client";
import type { CreateTripInput, CompleteTripInput } from "@/types/trip";

interface TripWithRelations extends Trip {
  vehicle: { regNo: string; name: string };
  driver: { name: string };
}

interface DispatchOption {
  vehicles: Pick<Vehicle, "id" | "regNo" | "name" | "capacityKg" | "status">[];
  drivers: Pick<Driver, "id" | "name" | "status" | "licenseExpiry">[];
}

interface TripFilters {
  status?: string;
  vehicleId?: string;
  driverId?: string;
  q?: string;
}

interface TripState {
  items: TripWithRelations[];
  options: DispatchOption | null;
  loading: boolean;
  error?: string;
  filters: TripFilters;
  fetch: () => Promise<void>;
  fetchOptions: () => Promise<void>;
  create: (dto: CreateTripInput) => Promise<Trip>;
  dispatch: (id: string) => Promise<void>;
  complete: (id: string, dto: CompleteTripInput) => Promise<void>;
  cancel: (id: string, reason: string) => Promise<void>;
  setFilter: (key: keyof TripFilters, value: string | undefined) => void;
}

export const useTripStore = create<TripState>((set, get) => ({
  items: [],
  options: null,
  loading: false,
  error: undefined,
  filters: {},

  async fetch() {
    set({ loading: true, error: undefined });
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value) params.set(key, value);
      }
      const qs = params.toString();
      const res = await fetch(`/api/trips${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch trips");
      const payload = await res.json();
      set({ items: payload.data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  async fetchOptions() {
    try {
      const res = await fetch("/api/trips/options");
      if (!res.ok) throw new Error("Failed to fetch dispatch options");
      const payload = await res.json();
      set({ options: payload.data });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  async create(dto) {
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const payload = await res.json();
      throw new Error(payload.error?.message ?? "Failed to create trip");
    }
    const payload = await res.json();
    return payload.data;
  },

  async dispatch(id) {
    const res = await fetch(`/api/trips/${id}/dispatch`, { method: "POST" });
    if (!res.ok) {
      const payload = await res.json();
      throw new Error(payload.error?.message ?? "Failed to dispatch trip");
    }
  },

  async complete(id, dto) {
    const res = await fetch(`/api/trips/${id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const payload = await res.json();
      throw new Error(payload.error?.message ?? "Failed to complete trip");
    }
  },

  async cancel(id, reason) {
    const res = await fetch(`/api/trips/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const payload = await res.json();
      throw new Error(payload.error?.message ?? "Failed to cancel trip");
    }
  },

  setFilter(key, value) {
    set((state) => ({ filters: { ...state.filters, [key]: value } }));
  },
}));
