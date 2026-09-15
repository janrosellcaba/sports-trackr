"use server";

import { requireUser } from "@/app/actions/auth";
import { listCustomExercises, listCustomSupplements } from "@/app/actions/catalog";
import { seedUserCatalog } from "@/lib/seed-catalog";
import { getWorkoutByDate, listWorkouts } from "@/app/actions/gym";
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
    todayWorkout,
    todaySports,
    todaySupplements,
    workouts,
    sports,
    supplements,
    customExercises,
    customSupplements,
  ] = await Promise.all([
    getWorkoutByDate(today),
    getSportsForDate(today),
    getSupplementsForDate(today),
    listWorkouts(),
    listSports(),
    listSupplements(),
    listCustomExercises(),
    listCustomSupplements(),
  ]);

  return {
    today,
    todayWorkout,
    todaySports,
    todaySupplements,
    workouts,
    sports,
    supplements,
    customExercises,
    customSupplements,
  };
}
