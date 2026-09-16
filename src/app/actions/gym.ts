"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/actions/auth";
import { getTodayLocalDateISO } from "@/lib/calculations";
import { gymLoad, parseIntensity } from "@/lib/muscles";
import { prisma } from "@/lib/prisma";
import type { GymSessionPayload, MuscleHitPayload } from "@/types/trackr";

const sessionInclude = {
  hits: {
    orderBy: { intensity: "desc" as const },
  },
};

function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function serializeSession(session: {
  id: string;
  date: string;
  notes: string | null;
  hits: {
    id: string;
    muscleId: string | null;
    muscleName: string;
    intensity: number;
  }[];
}): GymSessionPayload {
  const hits: MuscleHitPayload[] = session.hits.map((hit) => ({
    id: hit.id,
    muscleId: hit.muscleId,
    muscleName: hit.muscleName,
    intensity: hit.intensity,
  }));
  return {
    id: session.id,
    date: session.date,
    notes: session.notes,
    hits,
    hitCount: hits.length,
    totalLoad: gymLoad(hits),
  };
}

function revalidateApp() {
  revalidatePath("/");
}

export async function listGymSessions(limit = 60): Promise<GymSessionPayload[]> {
  const user = await requireUser();
  const take = Math.max(1, Math.min(limit, 200));
  const rows = await prisma.gymSession.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take,
    include: sessionInclude,
  });
  return rows.map(serializeSession);
}

export async function getGymSessionByDate(
  date = getTodayLocalDateISO(),
): Promise<GymSessionPayload | null> {
  const user = await requireUser();
  if (!isDateKey(date)) throw new Error("Invalid date.");
  const session = await prisma.gymSession.findUnique({
    where: { userId_date: { userId: user.id, date } },
    include: sessionInclude,
  });
  return session ? serializeSession(session) : null;
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
  const date = input.date ?? getTodayLocalDateISO();
  const intensity = parseIntensity(input.intensity);

  const muscle = await prisma.muscle.findFirst({
    where: { id: input.muscleId, userId: user.id },
    select: { id: true, name: true },
  });
  if (!muscle) throw new Error("Muscle not found.");

  const session = await getOrCreateSession(user.id, date);
  const existing = session.hits.find((hit) => hit.muscleId === muscle.id);

  if (existing) {
    await prisma.muscleHit.update({
      where: { id: existing.id },
      data: { intensity, muscleName: muscle.name },
    });
  } else {
    await prisma.muscleHit.create({
      data: {
        sessionId: session.id,
        muscleId: muscle.id,
        muscleName: muscle.name,
        intensity,
      },
    });
  }

  const next = await prisma.gymSession.findUniqueOrThrow({
    where: { id: session.id },
    include: sessionInclude,
  });
  revalidateApp();
  return serializeSession(next);
}

export async function deleteMuscleHit(hitId: string): Promise<GymSessionPayload | null> {
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
  return serializeSession(next);
}

export async function deleteGymSession(sessionId: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.gymSession.deleteMany({
    where: { id: sessionId, userId: user.id },
  });
  if (result.count === 0) throw new Error("Gym session not found.");
  revalidateApp();
}
