import { z } from "zod";
import { LicenseCategory, DriverStatus } from "@prisma/client";

export const driverSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  licenseNo: z.string().trim().min(1, "License number is required").max(50),
  licenseCategory: z.nativeEnum(LicenseCategory, {
    message: "Invalid license category",
  }),
  licenseExpiry: z.coerce.date({
    message: "Invalid expiry date",
  }),
  contact: z.string().trim().min(1, "Contact is required").max(20),
  safetyScore: z.number().int().min(0).max(100).default(100),
  status: z.nativeEnum(DriverStatus, {
    message: "Invalid driver status",
  }).optional().default("AVAILABLE"),
});

export type DriverInput = z.infer<typeof driverSchema>;

export const updateDriverSchema = driverSchema.partial();

export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
