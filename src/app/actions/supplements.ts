"use server";

import { requireUser } from "@/app/actions/auth";
import { isDateKey } from "@/lib/calculations";
import { getRequestToday } from "@/lib/request-today";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { parseSupplementIntakeInput } from "@/lib/supplements";
import {
  listSupplementsForDate,
  listSupplementsForUser,
  serializeSupplement,
} from "@/lib/db/activity";
import type { SupplementPayload } from "@/types/trackr";

export async function logSupplement(input: {
  type: string;
  amount: string;
  date?: string;
}): Promise<SupplementPayload> {
  const user = await requireUser();
  const date = input.date ?? (await getRequestToday());
  const parsed = parseSupplementIntakeInput({
    type: input.type,
    amount: input.amount,
    date,
  });

  const intake = await prisma.supplementIntake.create({
    data: {
      userId: user.id,
      name: parsed.name,
      dose: parsed.dose,
      date: parsed.date,
    },
  });

  revalidateApp();
  return serializeSupplement(intake);
}

export async function listSupplements(): Promise<SupplementPayload[]> {
  const user = await requireUser();
  const rows = await listSupplementsForUser(user.id);
  return rows.map(serializeSupplement);
}

export async function getSupplementsForDate(
  date?: string,
): Promise<SupplementPayload[]> {
  const user = await requireUser();
  const resolved = date ?? (await getRequestToday());
  if (!isDateKey(resolved)) throw new Error("Invalid date.");
  const rows = await listSupplementsForDate(user.id, resolved);
  return rows.map(serializeSupplement);
}

export async function updateSupplement(input: {
  id: string;
  type: string;
  amount: string;
  date?: string;
}): Promise<SupplementPayload> {
  const user = await requireUser();
  const date = input.date ?? (await getRequestToday());
  const parsed = parseSupplementIntakeInput({
    type: input.type,
    amount: input.amount,
    date,
  });

  const existing = await prisma.supplementIntake.findFirst({
    where: { id: input.id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new Error("Supplement entry not found.");

  const row = await prisma.supplementIntake.update({
    where: { id: input.id },
    data: { name: parsed.name, dose: parsed.dose, date: parsed.date },
  });

  revalidateApp();
  return serializeSupplement(row);
}

export async function deleteSupplement(id: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.supplementIntake.deleteMany({
    where: { id, userId: user.id },
  });
  if (result.count === 0) throw new Error("Supplement entry not found.");
  revalidateApp();
}
