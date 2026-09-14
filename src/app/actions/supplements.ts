"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/actions/auth";
import { getTodayLocalDateISO } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import type { SupplementPayload } from "@/types/trackr";

function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function serialize(row: {
  id: string;
  name: string;
  dose: string;
  date: string;
}): SupplementPayload {
  return {
    id: row.id,
    name: row.name,
    dose: row.dose,
    date: row.date,
  };
}

function revalidateApp() {
  revalidatePath("/");
}

export async function logSupplement(input: {
  name: string;
  dose: string;
  date?: string;
}): Promise<SupplementPayload> {
  const user = await requireUser();
  const name = input.name.trim();
  const dose = input.dose.trim();
  const date = input.date ?? getTodayLocalDateISO();

  if (!name) throw new Error("Supplement name is required.");
  if (!dose) throw new Error("Dose is required.");
  if (!isDateKey(date)) throw new Error("Invalid date.");

  const intake = await prisma.supplementIntake.create({
    data: {
      userId: user.id,
      name,
      dose,
      date,
    },
  });

  revalidateApp();
  return serialize(intake);
}

export async function listSupplements(limit = 80): Promise<SupplementPayload[]> {
  const user = await requireUser();
  const take = Math.max(1, Math.min(limit, 200));
  const rows = await prisma.supplementIntake.findMany({
    where: { userId: user.id },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take,
  });
  return rows.map(serialize);
}

export async function getSupplementsForDate(
  date = getTodayLocalDateISO(),
): Promise<SupplementPayload[]> {
  const user = await requireUser();
  if (!isDateKey(date)) throw new Error("Invalid date.");
  const rows = await prisma.supplementIntake.findMany({
    where: { userId: user.id, date },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serialize);
}

export async function deleteSupplement(id: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.supplementIntake.deleteMany({
    where: { id, userId: user.id },
  });
  if (result.count === 0) throw new Error("Supplement entry not found.");
  revalidateApp();
}
