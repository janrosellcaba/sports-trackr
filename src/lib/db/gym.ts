import { gymLoad } from "@/lib/muscles";
import { prisma } from "@/lib/prisma";
import type { GymSessionPayload, MuscleHitPayload } from "@/types/trackr";

const sessionInclude = {
  hits: {
    orderBy: { intensity: "desc" as const },
  },
};

export function serializeGymSession(session: {
  id: string;
  date: string;
  notes: string | null;
  hits: {
    id: string;
    muscleId: string;
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

export async function findGymSessionByDate(userId: string, date: string) {
  return prisma.gymSession.findUnique({
    where: { userId_date: { userId, date } },
    include: sessionInclude,
  });
}

export async function listGymSessionsForUser(userId: string, take?: number) {
  return prisma.gymSession.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    ...(take ? { take } : {}),
    include: sessionInclude,
  });
}

export async function listRecentGymSessionsForUser(
  userId: string,
  excludeDate: string,
  take = 4,
) {
  return prisma.gymSession.findMany({
    where: { userId, date: { not: excludeDate } },
    orderBy: { date: "desc" },
    take,
    include: sessionInclude,
  });
}

export async function listLatestHitsBeforeDate(userId: string, beforeDate: string) {
  const hits = await prisma.muscleHit.findMany({
    where: {
      session: { userId, date: { lt: beforeDate } },
    },
    select: {
      muscleId: true,
      intensity: true,
      session: { select: { date: true } },
    },
    orderBy: { session: { date: "desc" } },
  });

  const latest = new Map<
    string,
    { muscleId: string; lastDate: string; lastIntensity: number }
  >();
  for (const hit of hits) {
    if (latest.has(hit.muscleId)) continue;
    latest.set(hit.muscleId, {
      muscleId: hit.muscleId,
      lastDate: hit.session.date,
      lastIntensity: hit.intensity,
    });
  }
  return [...latest.values()];
}

export { sessionInclude };
