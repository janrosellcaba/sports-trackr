"use server";

import { requireUser } from "@/app/actions/auth";
import { listCustomExercises, listCustomSupplements } from "@/app/actions/catalog";
import { getWorkoutByDate, listWorkouts } from "@/app/actions/gym";
import {
  getSupplementsForDate,
  listSupplements,
} from "@/app/actions/supplements";
import { getTodayLocalDateISO } from "@/lib/calculations";
import type { AppState } from "@/types/trackr";

export async function getAppState(): Promise<AppState> {
  await requireUser();
  const today = getTodayLocalDateISO();
  const [
    todayWorkout,
    todaySupplements,
    workouts,
    supplements,
    customExercises,
    customSupplements,
  ] = await Promise.all([
    getWorkoutByDate(today),
    getSupplementsForDate(today),
    listWorkouts(),
    listSupplements(),
    listCustomExercises(),
    listCustomSupplements(),
  ]);

  return {
    today,
    todayWorkout,
    todaySupplements,
    workouts,
    supplements,
    customExercises,
    customSupplements,
  };
}
