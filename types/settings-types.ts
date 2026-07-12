import { z } from "zod";

export const CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_LABELS: Record<Currency, string> = {
  INR: "INR (₹)",
  USD: "USD ($)",
  EUR: "EUR (€)",
  GBP: "GBP (£)",
};

export const DISTANCE_UNITS = ["Kilometers", "Miles"] as const;
export type DistanceUnit = (typeof DISTANCE_UNITS)[number];

export const updateSettingsSchema = z.object({
  depotName: z.string().trim().min(1, "Depot name is required").max(120, "Depot name is too long"),
  currency: z.enum(CURRENCIES, { message: "Invalid currency" }),
  distanceUnit: z.enum(DISTANCE_UNITS, { message: "Invalid distance unit" }),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
