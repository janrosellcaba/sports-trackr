"use server";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  getRegistrationCode,
  sessionCookieOptions,
  signSessionToken,
  verifySessionToken,
  type AuthActionResult,
  type AuthUser,
} from "@/lib/auth";
import { seedUserCatalog } from "@/lib/seed-catalog";
import { isValidInviteCode, isValidUsername, normalizeUsername, validatePassword } from "@/lib/auth-logic";
import { MAX_PASSWORD_LENGTH } from "@/lib/constants";
import { isUniqueConstraintError } from "@/lib/prisma-errors";
import {
  assertNotRateLimited,
  clearAuthFailures,
  recordAuthFailure,
} from "@/lib/rate-limit";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function clientKey(username: string, ip: string): string {
  return `${ip}:${username || "*"}`;
}

async function requestIp(): Promise<string> {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return list.get("x-real-ip") || "unknown";
}

async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  const session = await prisma.session.create({
    data: { userId, expiresAt },
  });
  const token = await signSessionToken(userId, session.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions);
}

async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const parsed = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (parsed) {
    await prisma.session.deleteMany({ where: { id: parsed.sessionId } });
  }
  store.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  store.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const store = await cookies();
  const parsed = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!parsed) return null;

  const session = await prisma.session.findFirst({
    where: {
      id: parsed.sessionId,
      userId: parsed.userId,
      expiresAt: { gt: new Date() },
    },
    select: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
          accentTheme: true,
          colorMode: true,
          massUnit: true,
          distanceUnit: true,
        },
      },
    },
  });

  return session?.user ?? null;
});

export const requireUser = cache(async (): Promise<AuthUser> => {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
});

export async function register(
  formData: FormData,
): Promise<AuthActionResult | void> {
  const username = normalizeUsername(readString(formData, "username"));
  const password = readString(formData, "password");
  const inviteCode = readString(formData, "inviteCode");
  const ip = await requestIp();
  const key = clientKey(username, ip);

  const limited = assertNotRateLimited(key);
  if (!limited.ok) return { error: limited.error };

  try {
    if (!isValidInviteCode(inviteCode, getRegistrationCode())) {
      const next = recordAuthFailure(key);
      return { error: next.ok ? "Invalid registration code." : next.error };
    }
  } catch {
    return { error: "Registration is not available." };
  }

  if (!isValidUsername(username)) {
    return {
      error: "Username must be 2–32 characters (letters, numbers, . _ -).",
    };
  }

  const passwordError = validatePassword(password, MAX_PASSWORD_LENGTH);
  if (passwordError) return { error: passwordError };

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return { error: "That username is already taken." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: "USER",
      },
    });
    await seedUserCatalog(user.id);
    await createSession(user.id);
    clearAuthFailures(key);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "That username is already taken." };
    }
    throw error;
  }
  redirect("/");
}

export async function login(
  formData: FormData,
): Promise<AuthActionResult | void> {
  const username = normalizeUsername(readString(formData, "username"));
  const password = readString(formData, "password");
  const ip = await requestIp();
  const key = clientKey(username, ip);

  const limited = assertNotRateLimited(key);
  if (!limited.ok) return { error: limited.error };

  if (!username || !password) {
    return { error: "Username and password are required." };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  const valid = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, "$2a$10$invalidhashinvalidhashinvalidho");

  if (!user || !valid) {
    const next = recordAuthFailure(key);
    return { error: next.ok ? "Invalid username or password." : next.error };
  }

  await createSession(user.id);
  clearAuthFailures(key);
  redirect("/");
}

export async function logout(): Promise<void> {
  await destroyCurrentSession();
  redirect("/login");
}
