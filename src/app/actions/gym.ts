"use server";

import { requireUser } from "@/app/actions/auth";
import { isDateKey } from "@/lib/calculations";
import { getRequestToday } from "@/lib/request-today";
import { parseIntensity } from "@/lib/muscles";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import {
  findGymSessionByDate,
  listGymSessionsForUser,
  listRecentGymSessionsForUser,
  serializeGymSession,
  sessionInclude,
} from "@/lib/db/gym";
import type { GymSessionPayload } from "@/types/trackr";

export async function listGymSessions(): Promise<GymSessionPayload[]> {
  const user = await requireUser();
  const rows = await listGymSessionsForUser(user.id);
  return rows.map(serializeGymSession);
}

export async function getGymSessionByDate(
  date?: string,
): Promise<GymSessionPayload | null> {
  const user = await requireUser();
  const resolved = date ?? (await getRequestToday());
  if (!isDateKey(resolved)) throw new Error("Invalid date.");
  const session = await findGymSessionByDate(user.id, resolved);
  return session ? serializeGymSession(session) : null;
}

async function getOrCreateSession(userId: string, date: string) {
  if (!isDateKey(date)) throw new Error("Invalid date.");
  return prisma.gymSession.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date },
    update: {},
    include: sessionInclude,
  });
}

export async function upsertMuscleHit(input: {
  date?: string;
  muscleId: string;
  intensity: number;
}): Promise<GymSessionPayload> {
  const user = await requireUser();
  const date = input.date ?? (await getRequestToday());
  const intensity = parseIntensity(input.intensity);

  const muscle = await prisma.muscle.findFirst({
    where: { id: input.muscleId, userId: user.id },
    select: { id: true, name: true },
  });
  if (!muscle) throw new Error("Muscle not found.");

  const session = await getOrCreateSession(user.id, date);
  await prisma.muscleHit.upsert({
    where: {
      sessionId_muscleId: { sessionId: session.id, muscleId: muscle.id },
    },
    create: {
      sessionId: session.id,
      muscleId: muscle.id,
      muscleName: muscle.name,
      intensity,
    },
    update: { intensity, muscleName: muscle.name },
  });

  const next = await prisma.gymSession.findUniqueOrThrow({
    where: { id: session.id },
    include: sessionInclude,
  });
  revalidateApp();
  return serializeGymSession(next);
}

export async function deleteMuscleHit(
  hitId: string,
): Promise<GymSessionPayload | null> {
  const user = await requireUser();
  const hit = await prisma.muscleHit.findFirst({
    where: { id: hitId, session: { userId: user.id } },
    select: { id: true, sessionId: true },
  });
  if (!hit) throw new Error("Muscle log not found.");

  await prisma.muscleHit.delete({ where: { id: hit.id } });

  const remaining = await prisma.muscleHit.count({
    where: { sessionId: hit.sessionId },
  });
  if (remaining === 0) {
    await prisma.gymSession.delete({ where: { id: hit.sessionId } });
    revalidateApp();
    return null;
  }

  const next = await prisma.gymSession.findUniqueOrThrow({
    where: { id: hit.sessionId },
    include: sessionInclude,
  });
  revalidateApp();
  return serializeGymSession(next);
}

export async function deleteGymSession(sessionId: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.gymSession.deleteMany({
    where: { id: sessionId, userId: user.id },
  });
  if (result.count === 0) throw new Error("Gym session not found.");
  revalidateApp();
}

export async function getRecentGymSessions(
  excludeDate: string,
): Promise<GymSessionPayload[]> {
  const user = await requireUser();
  if (!isDateKey(excludeDate)) throw new Error("Invalid date.");
  const rows = await listRecentGymSessionsForUser(user.id, excludeDate);
  return rows.map(serializeGymSession);
}
