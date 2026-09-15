import { defaultExerciseSeeds, defaultSupplementSeeds } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

export async function seedUserCatalog(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { catalogSeeded: true },
  });
  if (!user || user.catalogSeeded) return;

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
      muscleGroup: item.muscleGroup,
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
