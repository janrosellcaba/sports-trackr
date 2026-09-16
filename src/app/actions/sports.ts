"use server";

import { requireUser } from "@/app/actions/auth";
import { isDateKey } from "@/lib/calculations";
import { getRequestToday } from "@/lib/request-today";
import { prisma } from "@/lib/prisma";
import { parseSportSessionInput } from "@/lib/sports";
import { revalidateApp } from "@/lib/revalidate";
import {
  listSportsForDate,
  listSportsForUser,
  serializeSport,
} from "@/lib/db/activity";
import type { SportSessionPayload } from "@/types/trackr";

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
    date: input.date ?? (await getRequestToday()),
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
  return serializeSport(row);
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
    date: input.date ?? (await getRequestToday()),
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
  return serializeSport(row);
}

export async function listSports(): Promise<SportSessionPayload[]> {
  const user = await requireUser();
  const rows = await listSportsForUser(user.id);
  return rows.map(serializeSport);
}

export async function getSportsForDate(
  date?: string,
): Promise<SportSessionPayload[]> {
  const user = await requireUser();
  const resolved = date ?? (await getRequestToday());
  if (!isDateKey(resolved)) throw new Error("Invalid date.");
  const rows = await listSportsForDate(user.id, resolved);
  return rows.map(serializeSport);
}

export async function deleteSport(id: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.sportSession.deleteMany({
    where: { id, userId: user.id },
  });
  if (result.count === 0) throw new Error("Sport session not found.");
  revalidateApp();
}
