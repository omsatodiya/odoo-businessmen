import type { NextRequest } from "next/server";

import { Api } from "@/lib/api";
import { verifyPassword } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { loginSchema } from "@/types/auth";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Api.badRequest("Request body must be valid JSON");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Api.badRequest("Invalid credentials payload", parsed.error.flatten());
  }

  const { email, password, rememberMe } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Same generic message whether the email doesn't exist or the password is
    // wrong — never let a client enumerate valid accounts.
    if (!user) {
      return Api.unauthorized("Invalid email or password");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
      return Api.unauthorized(
        `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in ${minutesLeft} minute(s).`
      );
    }

    const validPassword = await verifyPassword(password, user.password);

    if (!validPassword) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : attempts,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null,
        },
      });

      if (shouldLock) {
        return Api.unauthorized(
          `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in ${LOCKOUT_MINUTES} minute(s).`
        );
      }

      return Api.unauthorized("Invalid email or password");
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const token = await createSessionToken({
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    await setSessionCookie(token, rememberMe);

    return Api.ok({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    logger.error("Login failed", error, { email });
    return Api.internalError();
  }
}
