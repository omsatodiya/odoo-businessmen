import { create } from "zustand";
import type { VehicleAnalytics } from "@/lib/analytics";

interface AnalyticsState {
  vehicles: VehicleAnalytics[];
  monthlyRevenue: { month: string; revenue: number }[];
  fleetUtilization: number;
  loading: boolean;
  error?: string;
  fetch: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  vehicles: [],
  monthlyRevenue: [],
  fleetUtilization: 0,
  loading: false,
  error: undefined,

  async fetch() {
    set({ loading: true, error: undefined });
    try {
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const payload = await res.json();
      set({
        vehicles: payload.data.vehicles,
        monthlyRevenue: payload.data.monthlyRevenue,
        fleetUtilization: payload.data.fleetUtilization,
        loading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
}));
