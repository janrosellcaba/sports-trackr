"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import {
  SUPPLEMENT_TYPES,
  type LogSupplementInput,
  type SupplementPayload,
  type SupplementType,
} from "@/types/trackr";

const BUILTIN_LABELS: Record<string, string> = {
  WHEY_PROTEIN: "Whey",
  PRE_WORKOUT: "Pre-workout",
  CREATINE: "Creatine",
};

function startOfToday(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

function serializeSupplement(intake: {
  id: string;
  type: string;
  label?: string | null;
  catalogId?: string | null;
  amountGrams: number | null;
  scoops: number | null;
  notes: string | null;
  date: Date;
}): SupplementPayload {
  const type = (intake.type === "CUSTOM" ? "CUSTOM" : intake.type) as SupplementType;
  return {
    id: intake.id,
    type,
    label: intake.label || BUILTIN_LABELS[intake.type] || (type === "CUSTOM" ? "Custom" : intake.type),
    catalogId: intake.catalogId ?? null,
    amountGrams: intake.amountGrams,
    scoops: intake.scoops,
    notes: intake.notes,
    date: intake.date.toISOString(),
  };
}

export async function logSupplement(
  data: LogSupplementInput,
): Promise<SupplementPayload> {
  const user = await requireUser();

  const isCustom = data.type === "CUSTOM";
  if (!isCustom && !SUPPLEMENT_TYPES.includes(data.type as (typeof SUPPLEMENT_TYPES)[number])) {
    throw new Error("Invalid supplement type.");
  }
  if (isCustom && !data.label?.trim()) {
    throw new Error("Custom supplement label is required.");
  }

  if (
    data.amountGrams !== undefined &&
    (!Number.isFinite(data.amountGrams) || data.amountGrams < 0)
  ) {
    throw new Error("Amount must be a non-negative number.");
  }

  if (
    data.scoops !== undefined &&
    (!Number.isFinite(data.scoops) || data.scoops < 0)
  ) {
    throw new Error("Scoops must be a non-negative number.");
  }

  if (data.id) {
    const existing = await prisma.supplementIntake.findFirst({
      where: { id: data.id, userId: user.id },
    });
    if (existing) return serializeSupplement(existing);
  }

  const intake = await prisma.supplementIntake.create({
    data: {
      ...(data.id ? { id: data.id } : {}),
      userId: user.id,
      type: data.type,
      label: data.label?.trim() || BUILTIN_LABELS[data.type] || null,
      catalogId: data.catalogId ?? null,
      amountGrams: data.amountGrams ?? null,
      scoops: data.scoops ?? null,
      notes: data.notes?.trim() || null,
      date: data.date ? new Date(data.date) : new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath("/analytics");
  return serializeSupplement(intake);
}

export async function getTodaySupplements(): Promise<SupplementPayload[]> {
  const user = await requireUser();
  const intakes = await prisma.supplementIntake.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startOfToday(),
      },
    },
    orderBy: { date: "desc" },
  });

  return intakes.map(serializeSupplement);
}

export async function deleteSupplement(id: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.supplementIntake.deleteMany({
    where: { id, userId: user.id },
  });

  if (result.count === 0) {
    throw new Error("Supplement entry not found.");
  }

  revalidatePath("/");
  revalidatePath("/analytics");
}
