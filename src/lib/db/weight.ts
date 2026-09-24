import { prisma } from "@/lib/prisma";
import type { BodyWeightPayload } from "@/types/trackr";

export function serializeBodyWeight(row: {
  id: string;
  date: string;
  weightKg: number;
}): BodyWeightPayload {
  return {
    id: row.id,
    date: row.date,
    weightKg: row.weightKg,
  };
}

export function findBodyWeightForDate(userId: string, date: string) {
  return prisma.bodyWeight.findUnique({
    where: { userId_date: { userId, date } },
  });
}
