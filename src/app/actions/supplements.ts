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
  const user = await requireUser();

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
      userId: user.id,
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
