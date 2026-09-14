"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { confirmsUsername } from "@/lib/auth-logic";
import { resolveAccentTheme, resolveColorMode } from "@/lib/theme";

function revalidateAppearance() {
  revalidatePath("/");
}

export async function updateAccentTheme(themeId: string): Promise<void> {
  const user = await requireUser();
  const theme = resolveAccentTheme(themeId);
  await prisma.user.update({
    where: { id: user.id },
    data: { accentTheme: theme.id },
  });
  revalidateAppearance();
}

export async function updateColorMode(mode: string): Promise<void> {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { colorMode: resolveColorMode(mode) },
  });
  revalidateAppearance();
}

export async function deleteAccount(confirmation: string): Promise<{ error?: string }> {
  const user = await requireUser();
  if (!confirmsUsername(user.username, confirmation)) {
    return { error: "Type your username to confirm account deletion." };
  }

  await prisma.user.delete({ where: { id: user.id } });
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
