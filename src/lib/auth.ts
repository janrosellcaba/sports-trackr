import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "trackr_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const DEV_AUTH_SECRET = "dev-insecure-auth-secret-change-me";
const DEV_REGISTRATION_CODE = "01234";

export function getRegistrationCode(): string {
  const code = process.env.REGISTRATION_CODE;
  if (code && code.trim()) return code.trim();
  if (process.env.NODE_ENV === "production") {
    throw new Error("REGISTRATION_CODE is required in production.");
  }
  return DEV_REGISTRATION_CODE;
}

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) {
    return new TextEncoder().encode(secret);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }
  return new TextEncoder().encode(DEV_AUTH_SECRET);
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
  accentTheme: string;
  colorMode: string;
  massUnit: string;
  distanceUnit: string;
};

export type AuthActionResult = {
  error: string;
};

export async function signSessionToken(
  userId: string,
  sessionId: string,
): Promise<string> {
  return new SignJWT({ sub: userId, sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getAuthSecret());
}

export async function verifySessionToken(token: string | undefined): Promise<{
  userId: string;
  sessionId: string;
} | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const sessionId = typeof payload.sid === "string" ? payload.sid : null;
    if (!userId || !sessionId) return null;
    return { userId, sessionId };
  } catch {
    return null;
  }
}
