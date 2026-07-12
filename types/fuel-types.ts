import { z } from "zod";

export const fuelLogSchema = z.object({
  vehicleId: z.string().trim().min(1, "Vehicle is required"),
  tripId: z.string().trim().nullable().optional(),
  liters: z.number({ message: "Liters must be a number" }).positive("Liters must be positive"),
  cost: z.number({ message: "Cost must be a number" }).positive("Cost must be positive"),
  date: z.coerce.date({
    message: "Invalid date",
  }).optional().default(() => new Date()),
});

export type FuelLogInput = z.infer<typeof fuelLogSchema>;
