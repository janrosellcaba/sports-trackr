"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export const SUPPLEMENT_TYPES = [
  "WHEY_PROTEIN",
  "PRE_WORKOUT",
  "CREATINE",
] as const;

export type SupplementType = (typeof SUPPLEMENT_TYPES)[number];

export type SupplementPayload = {
  id: string;
  type: SupplementType;
  amountGrams: number | null;
  scoops: number | null;
  notes: string | null;
  date: string;
};

export type LogSupplementInput = {
  type: SupplementType;
  amountGrams?: number;
  scoops?: number;
  notes?: string;
};

function startOfToday(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

function serializeSupplement(intake: {
  id: string;
  type: string;
  amountGrams: number | null;
  scoops: number | null;
  notes: string | null;
  date: Date;
}): SupplementPayload {
  return {
    id: intake.id,
    type: intake.type as SupplementType,
    amountGrams: intake.amountGrams,
    scoops: intake.scoops,
    notes: intake.notes,
    date: intake.date.toISOString(),
  };
}

export async function logSupplement(
  data: LogSupplementInput,
): Promise<SupplementPayload> {
  if (!SUPPLEMENT_TYPES.includes(data.type)) {
    throw new Error("Invalid supplement type.");
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

  const intake = await prisma.supplementIntake.create({
    data: {
      type: data.type,
      amountGrams: data.amountGrams ?? null,
      scoops: data.scoops ?? null,
      notes: data.notes?.trim() || null,
      date: new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath("/analytics");
  return serializeSupplement(intake);
}

export async function getTodaySupplements(): Promise<SupplementPayload[]> {
  const intakes = await prisma.supplementIntake.findMany({
    where: {
      date: {
        gte: startOfToday(),
      },
    },
    orderBy: { date: "desc" },
  });

  return intakes.map(serializeSupplement);
}

export async function deleteSupplement(id: string): Promise<void> {
  await prisma.supplementIntake.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/analytics");
}
