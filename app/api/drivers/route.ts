import { NextRequest } from "next/server";
import { requireAccess, AuthError } from "@/lib/session";
import { Api } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { driverSchema } from "@/types/driver-types";
import { logger } from "@/lib/logger";
import { Prisma, DriverStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAccess("DRIVERS", "VIEW");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    const where: Prisma.DriverWhereInput = {};

    if (status && status !== "ALL") {
      where.status = status as DriverStatus;
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { licenseNo: { contains: q, mode: "insensitive" } },
      ];
    }

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        trips: {
          select: {
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute trip completion rate for each driver
    const data = drivers.map((driver) => {
      const totalTrips = driver.trips.length;
      const completedTrips = driver.trips.filter((t) => t.status === "COMPLETED").length;
      const tripCompletionRate = totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0;

      // Remove trips relation from response to keep payload light
      const { trips, ...rest } = driver;
      return {
        ...rest,
        tripCompletionRate,
      };
    });

    return Api.ok(data);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    logger.error("Error in GET /api/drivers", error);
    return Api.internalError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAccess("DRIVERS", "FULL");
    const body = await req.json();
    const result = driverSchema.safeParse(body);
    if (!result.success) {
      return Api.badRequest("Invalid input data", result.error.format());
    }

    const driver = await prisma.driver.create({
      data: {
        name: result.data.name,
        licenseNo: result.data.licenseNo,
        licenseCategory: result.data.licenseCategory,
        licenseExpiry: result.data.licenseExpiry,
        contact: result.data.contact,
        safetyScore: result.data.safetyScore,
        status: result.data.status,
      },
    });

    return Api.created(driver);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Api.conflict("License number already exists");
    }
    logger.error("Error in POST /api/drivers", error);
    return Api.internalError();
  }
}
