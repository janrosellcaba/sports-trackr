import { prisma } from "@/lib/prisma";
import type { SportSessionPayload, SupplementPayload } from "@/types/trackr";

export function serializeSport(row: {
  id: string;
  date: string;
  type: string;
  durationMinutes: number | null;
  distanceKm: number | null;
  distanceMeters: number | null;
  pace: string | null;
  effort: string | null;
  notes: string | null;
}): SportSessionPayload {
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    durationMinutes: row.durationMinutes,
    distanceKm: row.distanceKm,
    distanceMeters: row.distanceMeters,
    pace: row.pace,
    effort: row.effort,
    notes: row.notes,
  };
}

export function serializeSupplement(row: {
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

export function listSportsForUser(userId: string, take?: number) {
  return prisma.sportSession.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    ...(take ? { take } : {}),
  });
}

export function listSportsForDate(userId: string, date: string) {
  return prisma.sportSession.findMany({
    where: { userId, date },
    orderBy: { createdAt: "desc" },
  });
}

export function listSupplementsForUser(userId: string, take?: number) {
  return prisma.supplementIntake.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    ...(take ? { take } : {}),
  });
}

export function listSupplementsForDate(userId: string, date: string) {
  return prisma.supplementIntake.findMany({
    where: { userId, date },
    orderBy: { createdAt: "desc" },
  });
}
