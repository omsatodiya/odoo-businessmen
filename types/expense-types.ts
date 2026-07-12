import { z } from "zod";
import { ExpenseType } from "@prisma/client";

export const expenseSchema = z.object({
  vehicleId: z.string().trim().min(1, "Vehicle is required"),
  tripId: z.string().trim().nullable().optional(),
  type: z.nativeEnum(ExpenseType, {
    message: "Invalid expense type",
  }),
  amount: z.number({ message: "Amount must be a number" }).positive("Amount must be positive"),
  date: z.coerce.date({
    message: "Invalid date",
  }).optional().default(() => new Date()),
  note: z.string().trim().max(500).nullable().optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
