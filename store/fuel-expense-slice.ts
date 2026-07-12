import { create } from "zustand";
import type { FuelLog, Expense, TripStatus } from "@prisma/client";

import type { FuelLogInput } from "@/types/fuel-types";
import type { ExpenseInput } from "@/types/expense-types";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export interface FuelLogWithVehicle extends FuelLog {
  vehicle: {
    regNo: string;
    name: string;
  };
  trip?: {
    code: string;
  } | null;
}

export interface ExpenseWithVehicle extends Expense {
  vehicle: {
    regNo: string;
    name: string;
  };
  trip?: {
    code: string;
    status: TripStatus;
  } | null;
}

export interface FuelExpenseState {
  fuelLogs: FuelLogWithVehicle[];
  expenses: ExpenseWithVehicle[];
  loading: boolean;
  error?: string;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalOperationalCost: number;
  filters: {
    vehicleId: string;
  };
  fetchFuelLogs: () => Promise<void>;
  fetchExpenses: () => Promise<void>;
  createFuelLog: (dto: FuelLogInput) => Promise<void>;
  createExpense: (dto: ExpenseInput) => Promise<void>;
  setFilter: (key: string, value: string) => void;
}

export const useFuelExpenseStore = create<FuelExpenseState>((set, get) => ({
  fuelLogs: [],
  expenses: [],
  loading: false,
  error: undefined,
  totalFuelCost: 0,
  totalMaintenanceCost: 0,
  totalOperationalCost: 0,
  filters: {
    vehicleId: "ALL",
  },
  fetchFuelLogs: async () => {
    set({ loading: true, error: undefined });
    try {
      const { vehicleId } = get().filters;
      const params = new URLSearchParams();
      if (vehicleId && vehicleId !== "ALL") params.append("vehicleId", vehicleId);

      const res = await fetch(`/api/fuel-logs?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to fetch fuel logs");
      }
      const json = await res.json();
      set({
        fuelLogs: json.data,
        totalFuelCost: json.meta?.totalFuelCost || 0,
        totalMaintenanceCost: json.meta?.totalMaintenanceCost || 0,
        totalOperationalCost: json.meta?.totalOperationalCost || 0,
        loading: false,
      });
    } catch (err) {
      set({ error: errorMessage(err, "Failed to load fuel logs"), loading: false });
    }
  },
  fetchExpenses: async () => {
    set({ loading: true, error: undefined });
    try {
      const { vehicleId } = get().filters;
      const params = new URLSearchParams();
      if (vehicleId && vehicleId !== "ALL") params.append("vehicleId", vehicleId);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to fetch expenses");
      }
      const json = await res.json();
      set({
        expenses: json.data,
        totalFuelCost: json.meta?.totalFuelCost || 0,
        totalMaintenanceCost: json.meta?.totalMaintenanceCost || 0,
        totalOperationalCost: json.meta?.totalOperationalCost || 0,
        loading: false,
      });
    } catch (err) {
      set({ error: errorMessage(err, "Failed to load expenses"), loading: false });
    }
  },
  createFuelLog: async (dto) => {
    set({ loading: true, error: undefined });
    try {
      const res = await fetch("/api/fuel-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to log fuel");
      }
      // Re-fetch both logs and expenses to update aggregates properly
      await Promise.all([get().fetchFuelLogs(), get().fetchExpenses()]);
    } catch (err) {
      const message = errorMessage(err, "Request failed");
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },
  createExpense: async (dto) => {
    set({ loading: true, error: undefined });
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to add expense");
      }
      // Re-fetch both logs and expenses to update aggregates properly
      await Promise.all([get().fetchFuelLogs(), get().fetchExpenses()]);
    } catch (err) {
      const message = errorMessage(err, "Request failed");
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
    get().fetchFuelLogs();
    get().fetchExpenses();
  },
}));
