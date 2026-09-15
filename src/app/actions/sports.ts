"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/actions/auth";
import { getTodayLocalDateISO } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import { parseSportSessionInput } from "@/lib/sports";
import type { SportSessionPayload } from "@/types/trackr";

function serialize(row: {
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

function revalidateApp() {
  revalidatePath("/");
}

export async function logSport(input: {
  type: string;
  date?: string;
  durationMinutes?: number | null;
  distanceKm?: number | null;
  distanceMeters?: number | null;
  pace?: string | null;
  effort?: string | null;
  notes?: string | null;
}): Promise<SportSessionPayload> {
  const user = await requireUser();
  const parsed = parseSportSessionInput({
    ...input,
    date: input.date ?? getTodayLocalDateISO(),
  });

  const row = await prisma.sportSession.create({
    data: {
      userId: user.id,
      date: parsed.date,
      type: parsed.type,
      durationMinutes: parsed.durationMinutes,
      distanceKm: parsed.distanceKm,
      distanceMeters: parsed.distanceMeters,
      pace: parsed.pace,
      effort: parsed.effort,
      notes: parsed.notes,
    },
  });

  revalidateApp();
  return serialize(row);
}

export async function updateSport(
  id: string,
  input: {
    type: string;
    date?: string;
    durationMinutes?: number | null;
    distanceKm?: number | null;
    distanceMeters?: number | null;
    pace?: string | null;
    effort?: string | null;
    notes?: string | null;
  },
): Promise<SportSessionPayload> {
  const user = await requireUser();
  const parsed = parseSportSessionInput({
    ...input,
    date: input.date ?? getTodayLocalDateISO(),
  });

  const existing = await prisma.sportSession.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new Error("Sport session not found.");

  const row = await prisma.sportSession.update({
    where: { id },
    data: {
      date: parsed.date,
      type: parsed.type,
      durationMinutes: parsed.durationMinutes,
      distanceKm: parsed.distanceKm,
      distanceMeters: parsed.distanceMeters,
      pace: parsed.pace,
      effort: parsed.effort,
      notes: parsed.notes,
    },
  });

  revalidateApp();
  return serialize(row);
}

export async function listSports(limit = 80): Promise<SportSessionPayload[]> {
  const user = await requireUser();
  const take = Math.max(1, Math.min(limit, 200));
  const rows = await prisma.sportSession.findMany({
    where: { userId: user.id },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take,
  });
  return rows.map(serialize);
}

export async function getSportsForDate(
  date = getTodayLocalDateISO(),
): Promise<SportSessionPayload[]> {
  const user = await requireUser();
  const rows = await prisma.sportSession.findMany({
    where: { userId: user.id, date },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serialize);
}

export async function deleteSport(id: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.sportSession.deleteMany({
    where: { id, userId: user.id },
  });
  if (result.count === 0) throw new Error("Sport session not found.");
  revalidateApp();
}
