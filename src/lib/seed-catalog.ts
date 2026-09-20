import { defaultExerciseSeeds } from "@/lib/catalog";
import { DEFAULT_MUSCLES } from "@/lib/muscles";
import { nameKey } from "@/lib/names";
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { catalogSeeded: true },
  });
  if (user?.catalogSeeded) return existing;

  await prisma.muscle.createMany({
    data: DEFAULT_MUSCLES.map((name, index) => ({
      userId,
      name,
      nameKey: nameKey(name),
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
  if (user.catalogSeeded) return;

  const muscles = await ensureDefaultMuscles(userId);
  const muscleIdByName = new Map(
    muscles.map((item) => [item.name.toLowerCase(), item.id]),
  );

  const exercises = await prisma.customExercise.findMany({
    where: { userId },
    select: { nameKey: true },
  });

  const existingExercises = new Set(exercises.map((item) => item.nameKey));

  const exerciseCreates = defaultExerciseSeeds()
    .filter((item) => !existingExercises.has(nameKey(item.name)))
    .map((item) => ({
      userId,
      name: item.name,
      nameKey: nameKey(item.name),
      muscleId: muscleIdByName.get(item.muscle.toLowerCase()) ?? null,
      dualWeights: item.dualWeights,
    }));

  await prisma.$transaction([
    ...(exerciseCreates.length > 0
      ? [prisma.customExercise.createMany({ data: exerciseCreates })]
      : []),
    prisma.user.update({
      where: { id: userId },
      data: { catalogSeeded: true },
    }),
  ]);
}
