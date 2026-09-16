"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/actions/auth";
import {
  parseCustomExerciseInput,
  parseCustomSupplementInput,
  parseNewMuscleName,
  parsePersonalRecordInput,
} from "@/lib/catalog";
import { getTodayLocalDateISO } from "@/lib/calculations";
import { parseMuscleName, sameMuscleName } from "@/lib/muscles";
import { prisma } from "@/lib/prisma";
import type {
  CustomExercisePayload,
  CustomSupplementPayload,
  MusclePayload,
} from "@/types/trackr";

function serializeMuscle(row: {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
}): MusclePayload {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeExercise(row: {
  id: string;
  name: string;
  muscleId: string | null;
  muscle: { name: string } | null;
  workingWeight: number | null;
  workingReps: number | null;
  prWeight: number | null;
  prReps: number | null;
  prDate: string | null;
  createdAt: Date;
}): CustomExercisePayload {
  return {
    id: row.id,
    name: row.name,
    muscleId: row.muscleId,
    muscleName: row.muscle?.name ?? null,
    workingWeight: row.workingWeight,
    workingReps: row.workingReps,
    prWeight: row.prWeight,
    prReps: row.prReps,
    prDate: row.prDate,
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeSupplement(row: {
  id: string;
  name: string;
  defaultDose: string;
  iconOrType: string;
  createdAt: Date;
}): CustomSupplementPayload {
  return {
    id: row.id,
    name: row.name,
    defaultDose: row.defaultDose,
    iconOrType: row.iconOrType,
    createdAt: row.createdAt.toISOString(),
  };
}

function revalidateCatalog() {
  revalidatePath("/");
}

const exerciseInclude = { muscle: { select: { name: true } } };

export async function listMuscles(): Promise<MusclePayload[]> {
  const user = await requireUser();
  const rows = await prisma.muscle.findMany({
    where: { userId: user.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(serializeMuscle);
}

export async function createMuscle(input: { name: string }): Promise<MusclePayload> {
  const user = await requireUser();
  const existing = await prisma.muscle.findMany({
    where: { userId: user.id },
    select: { name: true, sortOrder: true },
  });
  const name = parseNewMuscleName(input.name, existing);
  const sortOrder =
    existing.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
  const row = await prisma.muscle.create({
    data: { userId: user.id, name, sortOrder },
  });
  revalidateCatalog();
  return serializeMuscle(row);
}

export async function updateMuscle(input: {
  id: string;
  name: string;
}): Promise<MusclePayload> {
  const user = await requireUser();
  const name = parseMuscleName(input.name);
  const existing = await prisma.muscle.findFirst({
    where: { id: input.id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new Error("Muscle not found.");

  const others = await prisma.muscle.findMany({
    where: { userId: user.id, id: { not: input.id } },
    select: { name: true },
  });
  if (others.some((item) => sameMuscleName(item.name, name))) {
    throw new Error("A muscle with that name already exists.");
  }

  const row = await prisma.muscle.update({
    where: { id: input.id },
    data: { name },
  });
  await prisma.muscleHit.updateMany({
    where: { muscleId: input.id, session: { userId: user.id } },
    data: { muscleName: name },
  });
  revalidateCatalog();
  return serializeMuscle(row);
}

export async function deleteMuscle(id: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.muscle.deleteMany({
    where: { id, userId: user.id },
  });
  if (result.count === 0) throw new Error("Muscle not found.");
  revalidateCatalog();
}

export async function moveMuscle(
  id: string,
  direction: "up" | "down",
): Promise<MusclePayload[]> {
  const user = await requireUser();
  const rows = await prisma.muscle.findMany({
    where: { userId: user.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const index = rows.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Muscle not found.");
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= rows.length) return rows.map(serializeMuscle);

  const current = rows[index];
  const other = rows[swapWith];
  await prisma.$transaction([
    prisma.muscle.update({
      where: { id: current.id },
      data: { sortOrder: other.sortOrder },
    }),
    prisma.muscle.update({
      where: { id: other.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);
  revalidateCatalog();
  return listMuscles();
}

export async function listCustomExercises(): Promise<CustomExercisePayload[]> {
  const user = await requireUser();
  const rows = await prisma.customExercise.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    include: exerciseInclude,
  });
  return rows.map(serializeExercise);
}

export async function listCustomSupplements(): Promise<CustomSupplementPayload[]> {
  const user = await requireUser();
  const rows = await prisma.customSupplement.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
  return rows.map(serializeSupplement);
}

async function snapshotExercise(input: {
  exerciseId: string;
  workingWeight: number | null;
  workingReps: number | null;
  prWeight: number | null;
  prReps: number | null;
  previous?: {
    workingWeight: number | null;
    workingReps: number | null;
    prWeight: number | null;
    prReps: number | null;
  };
}) {
  const changed =
    !input.previous ||
    input.previous.workingWeight !== input.workingWeight ||
    input.previous.workingReps !== input.workingReps ||
    input.previous.prWeight !== input.prWeight ||
    input.previous.prReps !== input.prReps;

  const hasNumbers =
    input.workingWeight != null ||
    input.workingReps != null ||
    input.prWeight != null ||
    input.prReps != null;

  if (!changed || !hasNumbers) return;

  const date = getTodayLocalDateISO();
  await prisma.exerciseSnapshot.upsert({
    where: {
      exerciseId_date: { exerciseId: input.exerciseId, date },
    },
    create: {
      exerciseId: input.exerciseId,
      date,
      workingWeight: input.workingWeight,
      workingReps: input.workingReps,
      prWeight: input.prWeight,
      prReps: input.prReps,
    },
    update: {
      workingWeight: input.workingWeight,
      workingReps: input.workingReps,
      prWeight: input.prWeight,
      prReps: input.prReps,
    },
  });
}

export async function createCustomExercise(input: {
  name: string;
  muscleId?: string | null;
  workingWeight?: number | null;
  workingReps?: number | null;
  prWeight?: number | null;
  prReps?: number | null;
  prDate?: string | null;
}): Promise<CustomExercisePayload> {
  const user = await requireUser();
  const parsed = parseCustomExerciseInput(input);
  if (parsed.muscleId) {
    const muscle = await prisma.muscle.findFirst({
      where: { id: parsed.muscleId, userId: user.id },
      select: { id: true },
    });
    if (!muscle) throw new Error("Muscle not found.");
  }

  const prDate =
    parsed.prWeight != null && !parsed.prDate
      ? getTodayLocalDateISO()
      : parsed.prDate;

  const row = await prisma.customExercise.create({
    data: {
      userId: user.id,
      name: parsed.name,
      muscleId: parsed.muscleId,
      workingWeight: parsed.workingWeight,
      workingReps: parsed.workingReps,
      prWeight: parsed.prWeight,
      prReps: parsed.prReps,
      prDate,
    },
    include: exerciseInclude,
  });
  await snapshotExercise({
    exerciseId: row.id,
    workingWeight: row.workingWeight,
    workingReps: row.workingReps,
    prWeight: row.prWeight,
    prReps: row.prReps,
  });
  revalidateCatalog();
  return serializeExercise(row);
}

export async function updateCustomExercise(input: {
  id: string;
  name: string;
  muscleId?: string | null;
  workingWeight?: number | null;
  workingReps?: number | null;
  prWeight?: number | null;
  prReps?: number | null;
  prDate?: string | null;
}): Promise<CustomExercisePayload> {
  const user = await requireUser();
  const parsed = parseCustomExerciseInput(input);
  const existing = await prisma.customExercise.findFirst({
    where: { id: input.id, userId: user.id },
  });
  if (!existing) throw new Error("Custom exercise not found.");
  if (parsed.muscleId) {
    const muscle = await prisma.muscle.findFirst({
      where: { id: parsed.muscleId, userId: user.id },
      select: { id: true },
    });
    if (!muscle) throw new Error("Muscle not found.");
  }

  const prDate =
    parsed.prWeight != null && !parsed.prDate
      ? existing.prDate ?? getTodayLocalDateISO()
      : parsed.prDate;

  const row = await prisma.customExercise.update({
    where: { id: input.id },
    data: {
      name: parsed.name,
      muscleId: parsed.muscleId,
      workingWeight: parsed.workingWeight,
      workingReps: parsed.workingReps,
      prWeight: parsed.prWeight,
      prReps: parsed.prReps,
      prDate,
    },
    include: exerciseInclude,
  });
  await snapshotExercise({
    exerciseId: row.id,
    workingWeight: row.workingWeight,
    workingReps: row.workingReps,
    prWeight: row.prWeight,
    prReps: row.prReps,
    previous: {
      workingWeight: existing.workingWeight,
      workingReps: existing.workingReps,
      prWeight: existing.prWeight,
      prReps: existing.prReps,
    },
  });
  revalidateCatalog();
  return serializeExercise(row);
}

export async function recordPersonalRecord(input: {
  exerciseId?: string | null;
  prWeight?: number | null;
  prReps?: number | null;
  prDate?: string | null;
}): Promise<CustomExercisePayload> {
  const user = await requireUser();
  const parsed = parsePersonalRecordInput(input);
  const prDate = parsed.prDate ?? getTodayLocalDateISO();

  const existing = await prisma.customExercise.findFirst({
    where: { id: parsed.exerciseId, userId: user.id },
  });
  if (!existing) throw new Error("Exercise not found.");

  const row = await prisma.customExercise.update({
    where: { id: existing.id },
    data: {
      prWeight: parsed.prWeight,
      prReps: parsed.prReps,
      prDate,
    },
    include: exerciseInclude,
  });
  await snapshotExercise({
    exerciseId: row.id,
    workingWeight: row.workingWeight,
    workingReps: row.workingReps,
    prWeight: row.prWeight,
    prReps: row.prReps,
    previous: {
      workingWeight: existing.workingWeight,
      workingReps: existing.workingReps,
      prWeight: existing.prWeight,
      prReps: existing.prReps,
    },
  });
  revalidateCatalog();
  return serializeExercise(row);
}

export async function deleteCustomExercise(id: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.customExercise.deleteMany({
    where: { id, userId: user.id },
  });
  if (result.count === 0) throw new Error("Custom exercise not found.");
  revalidateCatalog();
}

export async function createCustomSupplement(input: {
  name: string;
  defaultDose: string;
  iconOrType?: string;
}): Promise<CustomSupplementPayload> {
  const user = await requireUser();
  const parsed = parseCustomSupplementInput(input);
  const row = await prisma.customSupplement.create({
    data: {
      userId: user.id,
      name: parsed.name,
      defaultDose: parsed.defaultDose,
      iconOrType: parsed.iconOrType,
    },
  });
  revalidateCatalog();
  return serializeSupplement(row);
}

export async function updateCustomSupplement(input: {
  id: string;
  name: string;
  defaultDose: string;
  iconOrType?: string;
}): Promise<CustomSupplementPayload> {
  const user = await requireUser();
  const parsed = parseCustomSupplementInput(input);
  const existing = await prisma.customSupplement.findFirst({
    where: { id: input.id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new Error("Custom supplement not found.");

  const row = await prisma.customSupplement.update({
    where: { id: input.id },
    data: {
      name: parsed.name,
      defaultDose: parsed.defaultDose,
      iconOrType: parsed.iconOrType,
    },
  });
  revalidateCatalog();
  return serializeSupplement(row);
}

export async function deleteCustomSupplement(id: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.customSupplement.deleteMany({
    where: { id, userId: user.id },
  });
  if (result.count === 0) throw new Error("Custom supplement not found.");
  revalidateCatalog();
}
