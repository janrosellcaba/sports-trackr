"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/actions/auth";
import {
  parseCustomExerciseInput,
  parseCustomSupplementInput,
} from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import type {
  CustomExercisePayload,
  CustomSupplementPayload,
} from "@/types/trackr";

function serializeExercise(row: {
  id: string;
  name: string;
  muscleGroup: string;
  defaultWeight: number | null;
  defaultReps: number | null;
  createdAt: Date;
}): CustomExercisePayload {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscleGroup,
    defaultWeight: row.defaultWeight,
    defaultReps: row.defaultReps,
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

export async function listCustomExercises(): Promise<CustomExercisePayload[]> {
  const user = await requireUser();
  const rows = await prisma.customExercise.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
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

export async function createCustomExercise(input: {
  name: string;
  muscleGroup: string;
  defaultWeight?: number | null;
  defaultReps?: number | null;
}): Promise<CustomExercisePayload> {
  const user = await requireUser();
  const parsed = parseCustomExerciseInput(input);
  const row = await prisma.customExercise.create({
    data: {
      userId: user.id,
      name: parsed.name,
      muscleGroup: parsed.muscleGroup,
      defaultWeight: parsed.defaultWeight,
      defaultReps: parsed.defaultReps,
    },
  });
  revalidateCatalog();
  return serializeExercise(row);
}

export async function updateCustomExercise(input: {
  id: string;
  name: string;
  muscleGroup: string;
  defaultWeight?: number | null;
  defaultReps?: number | null;
}): Promise<CustomExercisePayload> {
  const user = await requireUser();
  const parsed = parseCustomExerciseInput(input);
  const existing = await prisma.customExercise.findFirst({
    where: { id: input.id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new Error("Custom exercise not found.");

  const row = await prisma.customExercise.update({
    where: { id: input.id },
    data: {
      name: parsed.name,
      muscleGroup: parsed.muscleGroup,
      defaultWeight: parsed.defaultWeight,
      defaultReps: parsed.defaultReps,
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
