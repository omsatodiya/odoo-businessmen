import { z } from "zod";
import { VehicleType, VehicleStatus } from "@prisma/client";

export const createVehicleSchema = z.object({
  regNo: z
    .string()
    .trim()
    .min(1, "Registration number is required")
    .toUpperCase(),
  name: z.string().trim().min(1, "Vehicle name/model is required"),
  type: z.nativeEnum(VehicleType,{
    error: "Invalid vehicle type",
  }),
  capacityKg: z.coerce
    .number()
    .int("Capacity must be a whole number")
    .positive("Capacity must be a positive integer"),
  odometer: z.coerce
    .number()
    .int("Odometer must be a whole number")
    .nonnegative("Odometer must be a non-negative integer")
    .default(0),
  acquisitionCost: z.coerce
    .number()
    .positive("Acquisition cost must be a positive amount"),
  status: z.nativeEnum(VehicleStatus).default(VehicleStatus.AVAILABLE),
  region: z.string().trim().nullable().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
