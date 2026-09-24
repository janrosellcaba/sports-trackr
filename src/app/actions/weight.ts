"use server";

import { requireUser } from "@/app/actions/auth";
import { isDateKey } from "@/lib/calculations";
import { serializeBodyWeight } from "@/lib/db/weight";
import { prisma } from "@/lib/prisma";
import { getRequestToday } from "@/lib/request-today";
import { revalidateApp } from "@/lib/revalidate";
import { parseBodyWeightKg } from "@/lib/weight";
import type { BodyWeightPayload } from "@/types/trackr";

export async function saveBodyWeight(input: {
  date?: string;
  weightKg: number;
}): Promise<BodyWeightPayload> {
  const user = await requireUser();
  const date = input.date ?? (await getRequestToday());
  if (!isDateKey(date)) throw new Error("Invalid date.");
  const weightKg = parseBodyWeightKg(input.weightKg);

  const row = await prisma.bodyWeight.upsert({
    where: { userId_date: { userId: user.id, date } },
    create: { userId: user.id, date, weightKg },
    update: { weightKg },
  });

  revalidateApp();
  return serializeBodyWeight(row);
}

export async function deleteBodyWeight(id: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.bodyWeight.deleteMany({
    where: { id, userId: user.id },
  });
  if (result.count === 0) throw new Error("Weigh-in not found.");
  revalidateApp();
}
