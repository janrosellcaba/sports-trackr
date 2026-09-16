"use server";

import {
  listCustomExercises,
  listCustomSupplements,
  listMuscles,
} from "@/app/actions/catalog";
import { requireUser } from "@/app/actions/auth";
import { seedUserCatalog } from "@/lib/seed-catalog";
import { getGymSessionByDate, listGymSessions } from "@/app/actions/gym";
import { getSportsForDate, listSports } from "@/app/actions/sports";
import {
  getSupplementsForDate,
  listSupplements,
} from "@/app/actions/supplements";
import { getTodayLocalDateISO } from "@/lib/calculations";
import type { AppState } from "@/types/trackr";

export async function getAppState(): Promise<AppState> {
  const user = await requireUser();
  await seedUserCatalog(user.id);
  const today = getTodayLocalDateISO();
  const [
    todayGym,
    todaySports,
    todaySupplements,
    gymSessions,
    sports,
    supplements,
    muscles,
    customExercises,
    customSupplements,
  ] = await Promise.all([
    getGymSessionByDate(today),
    getSportsForDate(today),
    getSupplementsForDate(today),
    listGymSessions(),
    listSports(),
    listSupplements(),
    listMuscles(),
    listCustomExercises(),
    listCustomSupplements(),
  ]);

  return {
    today,
    todayGym,
    todaySports,
    todaySupplements,
    gymSessions,
    sports,
    supplements,
    muscles,
    customExercises,
    customSupplements,
  };
}
