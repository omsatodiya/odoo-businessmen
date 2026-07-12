import { Api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return Api.unauthorized();

    // Re-read from the DB rather than trusting the JWT payload alone, so a
    // role change or account deletion takes effect immediately.
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) return Api.unauthorized();

    return Api.ok({ user });
  } catch (error) {
    logger.error("Failed to load current session user", error);
    return Api.internalError();
  }
}
