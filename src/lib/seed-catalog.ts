import { defaultExerciseSeeds, defaultSupplementSeeds } from "@/lib/catalog";
import { DEFAULT_MUSCLES } from "@/lib/muscles";
import { prisma } from "@/lib/prisma";

export async function ensureDefaultMuscles(userId: string): Promise<
  Array<{ id: string; name: string; sortOrder: number }>
> {
  const existing = await prisma.muscle.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, sortOrder: true },
  });
  if (existing.length > 0) return existing;

  await prisma.muscle.createMany({
    data: DEFAULT_MUSCLES.map((name, index) => ({
      userId,
      name,
      sortOrder: index,
    })),
  });

  return prisma.muscle.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, sortOrder: true },
  });
}

export async function seedUserCatalog(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { catalogSeeded: true },
  });
  if (!user) return;

  const muscles = await ensureDefaultMuscles(userId);
  if (user.catalogSeeded) return;

  const muscleIdByName = new Map(
    muscles.map((item) => [item.name.toLowerCase(), item.id]),
  );

  const [exercises, supplements] = await Promise.all([
    prisma.customExercise.findMany({
      where: { userId },
      select: { name: true },
    }),
    prisma.customSupplement.findMany({
      where: { userId },
      select: { name: true },
    }),
  ]);

  const existingExercises = new Set(
    exercises.map((item) => item.name.trim().toLowerCase()),
  );
  const existingSupplements = new Set(
    supplements.map((item) => item.name.trim().toLowerCase()),
  );

  const exerciseCreates = defaultExerciseSeeds()
    .filter((item) => !existingExercises.has(item.name.toLowerCase()))
    .map((item) => ({
      userId,
      name: item.name,
      muscleId: muscleIdByName.get(item.muscle.toLowerCase()) ?? null,
    }));

  const supplementCreates = defaultSupplementSeeds()
    .filter((item) => !existingSupplements.has(item.name.toLowerCase()))
    .map((item) => ({
      userId,
      name: item.name,
      defaultDose: item.defaultDose,
      iconOrType: "pill",
    }));

  await prisma.$transaction([
    ...(exerciseCreates.length > 0
      ? [prisma.customExercise.createMany({ data: exerciseCreates })]
      : []),
    ...(supplementCreates.length > 0
      ? [prisma.customSupplement.createMany({ data: supplementCreates })]
      : []),
    prisma.user.update({
      where: { id: userId },
      data: { catalogSeeded: true },
    }),
  ]);
}
