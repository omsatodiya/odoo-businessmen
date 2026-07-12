import { z } from "zod";

export const tripQuerySchema = z.object({
  status: z.string().optional(),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  q: z.string().optional(),
});

export const createTripSchema = z.object({
  source: z.string().min(1, "Source is required"),
  destination: z.string().min(1, "Destination is required"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
  cargoWeightKg: z.coerce.number().int().positive("Cargo weight must be positive"),
  plannedDistanceKm: z.coerce.number().int().positive("Planned distance must be positive"),
});

export const dispatchTripSchema = z.object({});

export const completeTripSchema = z.object({
  endOdometer: z.coerce.number().int().positive("End odometer must be positive"),
  fuelConsumedL: z.coerce.number().min(0).optional(),
  revenue: z.coerce.number().min(0).optional(),
});

export const cancelTripSchema = z.object({
  reason: z.string().min(1, "Cancellation reason is required"),
});

export type TripQuery = z.infer<typeof tripQuerySchema>;
export type CreateTripInput = z.infer<typeof createTripSchema>;
export type DispatchTripInput = z.infer<typeof dispatchTripSchema>;
export type CompleteTripInput = z.infer<typeof completeTripSchema>;
export type CancelTripInput = z.infer<typeof cancelTripSchema>;
