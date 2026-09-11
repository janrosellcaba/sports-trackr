"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  getRegistrationCode,
  isJanIdentity,
  sessionCookieOptions,
  signSessionToken,
  verifySessionToken,
  type AuthActionResult,
  type AuthUser,
} from "@/lib/auth";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
    select: { id: true, email: true, name: true, role: true },
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
  const name = readString(formData, "name").trim();
  const email = normalizeEmail(readString(formData, "email"));
  const password = readString(formData, "password");
  const inviteCode = readString(formData, "inviteCode").trim();

  if (inviteCode !== getRegistrationCode()) {
    return { error: "Invalid registration code" };
  }

  if (!isValidEmail(email)) {
    return { error: "Enter a valid email address." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name || null,
      role: isJanIdentity(email, name) ? "ADMIN" : "USER",
    },
  });

  await createSession(user.id);
  redirect("/");
}

export async function login(
  formData: FormData,
): Promise<AuthActionResult | void> {
  const email = normalizeEmail(readString(formData, "email"));
  const password = readString(formData, "password");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Invalid email or password." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
