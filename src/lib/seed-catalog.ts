import { defaultExerciseSeeds } from "@/lib/catalog";
import { parseAppLocale } from "@/lib/locale";
import { nameKey } from "@/lib/names";
import { prisma } from "@/lib/prisma";
import { starterMuscles } from "@/lib/starter-catalog";

export async function ensureDefaultMuscles(
  userId: string,
  locale: unknown = "en",
): Promise<Array<{ id: string; name: string; nameKey: string; sortOrder: number }>> {
  const existing = await prisma.muscle.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, nameKey: true, sortOrder: true },
  });
  if (existing.length > 0) return existing;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { catalogSeeded: true },
  });
  if (user?.catalogSeeded) return existing;

  const muscles = starterMuscles(locale);
  await prisma.muscle.createMany({
    data: muscles.map((item, index) => ({
      userId,
      name: item.name,
      nameKey: item.key,
      sortOrder: index,
    })),
  });

  return prisma.muscle.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, nameKey: true, sortOrder: true },
  });
}

export async function seedUserCatalog(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { catalogSeeded: true, locale: true, onboardingCompleted: true },
  });
  if (!user) return;
  if (user.catalogSeeded) return;
  if (!user.onboardingCompleted) return;

  await seedStarterCatalog(userId, user.locale);
}

export async function seedStarterCatalog(userId: string, locale: unknown): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { catalogSeeded: true },
  });
  if (!user || user.catalogSeeded) return;

  const lang = parseAppLocale(locale);
  const muscles = await ensureDefaultMuscles(userId, lang);
  const muscleIdByKey = new Map(muscles.map((item) => [item.nameKey, item.id]));

  const exercises = await prisma.customExercise.findMany({
    where: { userId },
    select: { nameKey: true },
  });
  const existingExercises = new Set(exercises.map((item) => item.nameKey));

  const exerciseCreates = defaultExerciseSeeds(lang)
    .filter((item) => !existingExercises.has(nameKey(item.name)))
    .map((item) => ({
      userId,
      name: item.name,
      nameKey: nameKey(item.name),
      muscleId: muscleIdByKey.get(item.muscleKey) ?? null,
      dualWeights: item.dualWeights,
    }));

  await prisma.$transaction([
    ...(exerciseCreates.length > 0
      ? [prisma.customExercise.createMany({ data: exerciseCreates })]
      : []),
    prisma.user.update({
      where: { id: userId },
      data: { catalogSeeded: true, locale: lang },
    }),
  ]);
}
