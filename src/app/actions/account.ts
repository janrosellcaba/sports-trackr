"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { requireUser } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { deleteUserRecord } from "@/lib/db/user";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  verifySessionToken,
  type AuthActionResult,
} from "@/lib/auth";
import { validatePassword, confirmsUsername } from "@/lib/auth-logic";
import { MAX_PASSWORD_LENGTH } from "@/lib/constants";
import { resolveAccentTheme, resolveColorMode } from "@/lib/theme";
import { revalidateApp } from "@/lib/revalidate";
import {
  assertNotRateLimited,
  clearAuthFailures,
  recordAuthFailure,
} from "@/lib/rate-limit";

export type AccountSession = {
  id: string;
  createdAt: string;
  current: boolean;
};

async function currentSessionId(): Promise<string | null> {
  const store = await cookies();
  const parsed = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  return parsed?.sessionId ?? null;
}

export async function updateAccentTheme(themeId: string): Promise<void> {
  const user = await requireUser();
  const theme = resolveAccentTheme(themeId);
  await prisma.user.update({
    where: { id: user.id },
    data: { accentTheme: theme.id },
  });
  revalidateApp();
}

export async function updateColorMode(mode: string): Promise<void> {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { colorMode: resolveColorMode(mode) },
  });
  revalidateApp();
}

export async function listActiveSessions(): Promise<AccountSession[]> {
  const user = await requireUser();
  const activeId = await currentSessionId();
  const rows = await prisma.session.findMany({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    current: row.id === activeId,
  }));
}

export async function revokeSession(sessionId: string): Promise<AuthActionResult | void> {
  const user = await requireUser();
  const activeId = await currentSessionId();
  if (sessionId === activeId) {
    return { error: "Use Log out to sign out of this device." };
  }
  const result = await prisma.session.deleteMany({
    where: { id: sessionId, userId: user.id },
  });
  if (result.count === 0) return { error: "Session not found." };
  revalidateApp();
}

export async function revokeOtherSessions(): Promise<void> {
  const user = await requireUser();
  const activeId = await currentSessionId();
  if (!activeId) return;
  await prisma.session.deleteMany({
    where: { userId: user.id, id: { not: activeId } },
  });
  revalidateApp();
}

export async function changePassword(formData: FormData): Promise<AuthActionResult | void> {
  const user = await requireUser();
  const currentPassword =
    typeof formData.get("currentPassword") === "string"
      ? String(formData.get("currentPassword"))
      : "";
  const nextPassword =
    typeof formData.get("newPassword") === "string"
      ? String(formData.get("newPassword"))
      : "";
  const confirmPassword =
    typeof formData.get("confirmPassword") === "string"
      ? String(formData.get("confirmPassword"))
      : "";

  const key = `password:${user.id}`;
  const limited = assertNotRateLimited(key);
  if (!limited.ok) return { error: limited.error };

  if (!currentPassword || !nextPassword) {
    return { error: "Current and new password are required." };
  }
  if (nextPassword !== confirmPassword) {
    return { error: "New passwords do not match." };
  }
  const passwordError = validatePassword(nextPassword, MAX_PASSWORD_LENGTH);
  if (passwordError) return { error: passwordError };

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!row) return { error: "Account not found." };

  const valid = await bcrypt.compare(currentPassword, row.passwordHash);
  if (!valid) {
    const next = recordAuthFailure(key);
    return { error: next.ok ? "Current password is incorrect." : next.error };
  }

  if (await bcrypt.compare(nextPassword, row.passwordHash)) {
    return { error: "Pick a password that is different from the current one." };
  }

  const passwordHash = await bcrypt.hash(nextPassword, 10);
  const activeId = await currentSessionId();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.session.deleteMany({
      where: activeId
        ? { userId: user.id, id: { not: activeId } }
        : { userId: user.id },
    }),
  ]);
  clearAuthFailures(key);
  revalidateApp();
}

export async function deleteAccount(
  confirmation: string,
): Promise<{ error?: string }> {
  const user = await requireUser();
  if (!confirmsUsername(user.username, confirmation)) {
    return { error: "Type your username to confirm account deletion." };
  }

  await deleteUserRecord(user.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
