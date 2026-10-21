"use server";

import { requireUser } from "@/app/actions/auth";
import {
  listCustomExercisesForUser,
  listMusclesForUser,
} from "@/app/actions/catalog";
import { loadHomeGlance } from "@/lib/db/home-glance";
import { ensureSportsCatalog, seedUserCatalog } from "@/lib/seed-catalog";
import { getRequestToday, resolveRequestedDate } from "@/lib/request-today";
import {
  findGymSessionByDate,
  listGymSessionsForUser,
  listLatestHitsBeforeDate,
  serializeGymSession,
} from "@/lib/db/gym";
import {
  listSportCatalog,
  listSportsForDate,
  listSportsForUser,
  listSupplementsForDate,
  listSupplementsForUser,
  serializeSport,
  serializeSupplement,
} from "@/lib/db/activity";
import {
  findBodyWeightForDate,
  listBodyWeightsForUser,
  serializeBodyWeight,
} from "@/lib/db/weight";
import { daysBetween } from "@/lib/recovery";
import type { WeekDayCell } from "@/lib/analytics";
import type {
  BodyWeightPayload,
  CustomExercisePayload,
  GymSessionPayload,
  MusclePayload,
  MuscleRecoveryPayload,
  SportCatalogPayload,
  SportSessionPayload,
  SupplementPayload,
} from "@/types/trackr";

export type HomeDayState = {
  today: string;
  date: string;
  gym: GymSessionPayload | null;
  sports: SportSessionPayload[];
  weight: BodyWeightPayload | null;
  supplements: SupplementPayload[];
  recovery: MuscleRecoveryPayload[];
  muscles: MusclePayload[];
  customExercises: CustomExercisePayload[];
  sportCatalog: SportCatalogPayload[];
  shape: { score: number; weekChange: number | null } | null;
  week: WeekDayCell[];
};

export type LogState = {
  today: string;
  gymSessions: GymSessionPayload[];
  sports: SportSessionPayload[];
  supplements: SupplementPayload[];
  bodyWeights: BodyWeightPayload[];
  muscles: MusclePayload[];
  sportCatalog: SportCatalogPayload[];
};

export type CatalogState = {
  muscles: MusclePayload[];
  customExercises: CustomExercisePayload[];
  sportCatalog: SportCatalogPayload[];
};

export async function getHomeDayState(
  dateParam?: string,
): Promise<HomeDayState> {
  const user = await requireUser();
  await seedUserCatalog(user.id);
  await ensureSportsCatalog(user.id);
  const today = await getRequestToday();
  const date = resolveRequestedDate(dateParam, today);
  const [
    gymRow,
    sportsRows,
    weightRow,
    supplementRows,
    latestHits,
    muscles,
    customExercises,
    sportCatalog,
    glance,
  ] = await Promise.all([
    findGymSessionByDate(user.id, date),
    listSportsForDate(user.id, date),
    findBodyWeightForDate(user.id, date),
    listSupplementsForDate(user.id, date),
    listLatestHitsBeforeDate(user.id, date),
    listMusclesForUser(user.id),
    listCustomExercisesForUser(user.id),
    listSportCatalog(user.id),
    loadHomeGlance(user.id, date, today),
  ]);

  return {
    today,
    date,
    gym: gymRow ? serializeGymSession(gymRow) : null,
    sports: sportsRows.map(serializeSport),
    weight: weightRow ? serializeBodyWeight(weightRow) : null,
    supplements: supplementRows.map(serializeSupplement),
    recovery: latestHits.map((hit) => ({
      ...hit,
      daysAgo: daysBetween(hit.lastDate, date),
    })),
    muscles,
    customExercises,
    sportCatalog,
    shape: glance.shape,
    week: glance.week,
  };
}

export async function getLogState(): Promise<LogState> {
  const user = await requireUser();
  await seedUserCatalog(user.id);
  await ensureSportsCatalog(user.id);
  const today = await getRequestToday();
  const [gymRows, sportsRows, supplementRows, weightRows, muscles, sportCatalog] =
    await Promise.all([
      listGymSessionsForUser(user.id),
      listSportsForUser(user.id),
      listSupplementsForUser(user.id),
      listBodyWeightsForUser(user.id),
      listMusclesForUser(user.id),
      listSportCatalog(user.id),
    ]);
  return {
    today,
    gymSessions: gymRows.map(serializeGymSession),
    sports: sportsRows.map(serializeSport),
    supplements: supplementRows.map(serializeSupplement),
    bodyWeights: weightRows.map(serializeBodyWeight),
    muscles,
    sportCatalog,
  };
}

export async function getCatalogState(): Promise<CatalogState> {
  const user = await requireUser();
  await seedUserCatalog(user.id);
  await ensureSportsCatalog(user.id);
  const [muscles, customExercises, sportCatalog] = await Promise.all([
    listMusclesForUser(user.id),
    listCustomExercisesForUser(user.id),
    listSportCatalog(user.id),
  ]);
  return { muscles, customExercises, sportCatalog };
}
