"use server";

import { requireUser } from "@/app/actions/auth";
import {
  listCustomExercisesForUser,
  listMusclesForUser,
} from "@/app/actions/catalog";
import { seedUserCatalog } from "@/lib/seed-catalog";
import { getRequestToday, resolveRequestedDate } from "@/lib/request-today";
import {
  findGymSessionByDate,
  listGymSessionsForUser,
  listLatestHitsBeforeDate,
  serializeGymSession,
} from "@/lib/db/gym";
import {
  listSportsForDate,
  listSportsForUser,
  listSupplementsForDate,
  listSupplementsForUser,
  serializeSport,
  serializeSupplement,
} from "@/lib/db/activity";
import { daysBetween } from "@/lib/recovery";
import type {
  CustomExercisePayload,
  GymSessionPayload,
  MusclePayload,
  MuscleRecoveryPayload,
  SportSessionPayload,
  SupplementPayload,
} from "@/types/trackr";

export type HomeDayState = {
  today: string;
  date: string;
  gym: GymSessionPayload | null;
  sports: SportSessionPayload[];
  supplements: SupplementPayload[];
  recovery: MuscleRecoveryPayload[];
  muscles: MusclePayload[];
  customExercises: CustomExercisePayload[];
};

export type LogState = {
  today: string;
  gymSessions: GymSessionPayload[];
  sports: SportSessionPayload[];
  supplements: SupplementPayload[];
  muscles: MusclePayload[];
};

export type CatalogState = {
  muscles: MusclePayload[];
  customExercises: CustomExercisePayload[];
};

export async function getHomeDayState(
  dateParam?: string,
): Promise<HomeDayState> {
  const user = await requireUser();
  await seedUserCatalog(user.id);
  const today = await getRequestToday();
  const date = resolveRequestedDate(dateParam, today);
  const [
    gymRow,
    sportsRows,
    supplementRows,
    latestHits,
    muscles,
    customExercises,
  ] = await Promise.all([
    findGymSessionByDate(user.id, date),
    listSportsForDate(user.id, date),
    listSupplementsForDate(user.id, date),
    listLatestHitsBeforeDate(user.id, date),
    listMusclesForUser(user.id),
    listCustomExercisesForUser(user.id),
  ]);

  return {
    today,
    date,
    gym: gymRow ? serializeGymSession(gymRow) : null,
    sports: sportsRows.map(serializeSport),
    supplements: supplementRows.map(serializeSupplement),
    recovery: latestHits.map((hit) => ({
      ...hit,
      daysAgo: daysBetween(hit.lastDate, date),
    })),
    muscles,
    customExercises,
  };
}

export async function getLogState(): Promise<LogState> {
  const user = await requireUser();
  await seedUserCatalog(user.id);
  const today = await getRequestToday();
  const [gymRows, sportsRows, supplementRows, muscles] = await Promise.all([
    listGymSessionsForUser(user.id),
    listSportsForUser(user.id),
    listSupplementsForUser(user.id),
    listMusclesForUser(user.id),
  ]);
  return {
    today,
    gymSessions: gymRows.map(serializeGymSession),
    sports: sportsRows.map(serializeSport),
    supplements: supplementRows.map(serializeSupplement),
    muscles,
  };
}

export async function getCatalogState(): Promise<CatalogState> {
  const user = await requireUser();
  await seedUserCatalog(user.id);
  const [muscles, customExercises] = await Promise.all([
    listMusclesForUser(user.id),
    listCustomExercisesForUser(user.id),
  ]);
  return { muscles, customExercises };
}
