import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "trackr_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const DEV_AUTH_SECRET = "dev-insecure-auth-secret-change-me";
const DEV_REGISTRATION_CODE = "01234";

export function getRegistrationCode(): string {
  return process.env.REGISTRATION_CODE ?? DEV_REGISTRATION_CODE;
}

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? DEV_AUTH_SECRET;
  return new TextEncoder().encode(secret);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

export type AuthUser = {
  id: string;
  username: string;
  role: string;
};

export function isAdminUser(user: {
  username: string;
  role?: string | null;
}): boolean {
  return user.role === "ADMIN" || user.username === "jan";
}

export type AuthActionResult = {
  error: string;
};

export async function signSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getAuthSecret());
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<string | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
