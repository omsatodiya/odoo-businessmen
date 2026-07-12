import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";

import { can, type Resource } from "@/lib/rbac";

const SESSION_COOKIE = "transitops_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  sub: string; // user id
  role: Role;
  email: string;
  name: string;
}

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.sub !== "string" || typeof payload.role !== "string") return null;

    return {
      sub: payload.sub,
      role: payload.role as Role,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

/**
 * `persistent=false` omits maxAge so the cookie is a browser-session cookie
 * (cleared on browser close) while the JWT itself still carries the normal
 * 7-day expiry server-side.
 */
export async function setSessionCookie(token: string, persistent = true) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(persistent ? { maxAge: SESSION_TTL_SECONDS } : {}),
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Thrown by requireAuth/requireAccess. Route handlers catch this and map
 * it to Api.unauthorized()/Api.forbidden() — see usage note below.
 */
export class AuthError extends Error {
  status: 401 | 403;

  constructor(status: 401 | 403, message: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthError(401, "Authentication required");
  return session;
}

/**
 * Guards a route by resource + required access level (see lib/rbac.ts).
 *
 * Usage in a route handler:
 *   try {
 *     const session = await requireAccess("FLEET", "FULL");
 *     ...
 *   } catch (error) {
 *     if (error instanceof AuthError) {
 *       return error.status === 401 ? Api.unauthorized(error.message) : Api.forbidden(error.message);
 *     }
 *     logger.error("...", error);
 *     return Api.internalError();
 *   }
 */
export async function requireAccess(resource: Resource, need: "VIEW" | "FULL"): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!can(session.role, resource, need)) {
    throw new AuthError(403, `Role ${session.role} lacks ${need} access to ${resource}`);
  }
  return session;
}
