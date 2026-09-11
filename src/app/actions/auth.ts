"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  getRegistrationCode,
  sessionCookieOptions,
  signSessionToken,
  verifySessionToken,
  type AuthActionResult,
  type AuthUser,
} from "@/lib/auth";
import {
  assignRole,
  isValidInviteCode,
  isValidUsername,
  normalizeUsername,
} from "@/lib/auth-logic";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function createSession(userId: string): Promise<void> {
  const token = await signSessionToken(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const userId = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, role: true },
  });
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function register(
  formData: FormData,
): Promise<AuthActionResult | void> {
  const username = normalizeUsername(readString(formData, "username"));
  const password = readString(formData, "password");
  const inviteCode = readString(formData, "inviteCode").trim();

  if (!isValidInviteCode(inviteCode, getRegistrationCode())) {
    return { error: "Invalid registration code" };
  }

  if (!isValidUsername(username)) {
    return {
      error: "Username must be 2–32 characters (letters, numbers, . _ -).",
    };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return { error: "That username is already taken." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      role: assignRole(username),
    },
  });

  await createSession(user.id);
  redirect("/");
}

export async function login(
  formData: FormData,
): Promise<AuthActionResult | void> {
  const username = normalizeUsername(readString(formData, "username"));
  const password = readString(formData, "password");

  if (!username || !password) {
    return { error: "Username and password are required." };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return { error: "Invalid username or password." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid username or password." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
