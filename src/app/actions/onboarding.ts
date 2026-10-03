"use server";

import { requireUser } from "@/app/actions/auth";
import { parseAppLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { seedStarterCatalog } from "@/lib/seed-catalog";

export async function saveOnboardingLocale(locale: string): Promise<{ locale: string }> {
  const user = await requireUser();
  const lang = parseAppLocale(locale);
  await prisma.user.update({
    where: { id: user.id },
    data: { locale: lang },
  });
  await seedStarterCatalog(user.id, lang);
  revalidateApp();
  return { locale: lang };
}

export async function completeOnboarding(): Promise<void> {
  const user = await requireUser();
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { locale: true, catalogSeeded: true },
  });
  if (!row) return;
  if (!row.catalogSeeded) {
    await seedStarterCatalog(user.id, row.locale);
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingCompleted: true },
  });
  revalidateApp();
}
