import { z } from "zod";

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  type: z.string().trim().min(1, "Service type is required"),
  cost: z.coerce
    .number()
    .nonnegative("Cost must be a non-negative number"),
  notes: z.string().trim().optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
