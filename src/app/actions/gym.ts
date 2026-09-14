"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/actions/auth";
import { getTodayLocalDateISO, workoutTonnage } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import type {
  ExercisePayload,
  SetPayload,
  WorkoutPayload,
} from "@/types/trackr";

const workoutInclude = {
  exercises: {
    orderBy: { order: "asc" as const },
    include: {
      sets: {
        orderBy: { setNumber: "asc" as const },
      },
    },
  },
};

function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function serializeWorkout(workout: {
  id: string;
  date: string;
  notes: string | null;
  exercises: {
    id: string;
    name: string;
    order: number;
    sets: { id: string; setNumber: number; weight: number; reps: number }[];
  }[];
}): WorkoutPayload {
  const exercises: ExercisePayload[] = workout.exercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    order: exercise.order,
    sets: exercise.sets.map((set) => ({
      id: set.id,
      setNumber: set.setNumber,
      weight: set.weight,
      reps: set.reps,
    })),
  }));

  const allSets = exercises.flatMap((exercise) => exercise.sets);
  return {
    id: workout.id,
    date: workout.date,
    notes: workout.notes,
    exercises,
    totalVolumeKg: Math.round(workoutTonnage(allSets)),
    setCount: allSets.length,
  };
}

function revalidateApp() {
  revalidatePath("/");
}

export async function listWorkouts(limit = 60): Promise<WorkoutPayload[]> {
  const user = await requireUser();
  const take = Math.max(1, Math.min(limit, 200));
  const rows = await prisma.workout.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take,
    include: workoutInclude,
  });
  return rows.map(serializeWorkout);
}

export async function getWorkoutByDate(
  date = getTodayLocalDateISO(),
): Promise<WorkoutPayload | null> {
  const user = await requireUser();
  if (!isDateKey(date)) throw new Error("Invalid date.");
  const workout = await prisma.workout.findUnique({
    where: { userId_date: { userId: user.id, date } },
    include: workoutInclude,
  });
  return workout ? serializeWorkout(workout) : null;
}

async function getOrCreateWorkout(userId: string, date: string) {
  if (!isDateKey(date)) throw new Error("Invalid date.");
  return prisma.workout.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date },
    update: {},
    include: workoutInclude,
  });
}

export async function addExercise(input: {
  date?: string;
  name: string;
}): Promise<WorkoutPayload> {
  const user = await requireUser();
  const date = input.date ?? getTodayLocalDateISO();
  const name = input.name.trim();
  if (!name) throw new Error("Exercise name is required.");

  const workout = await getOrCreateWorkout(user.id, date);
  const last = workout.exercises[workout.exercises.length - 1];

  await prisma.exerciseLog.create({
    data: {
      workoutId: workout.id,
      name,
      order: (last?.order ?? -1) + 1,
    },
  });

  const next = await prisma.workout.findUniqueOrThrow({
    where: { id: workout.id },
    include: workoutInclude,
  });
  revalidateApp();
  return serializeWorkout(next);
}

export async function addSet(input: {
  exerciseLogId: string;
  weight: number;
  reps: number;
}): Promise<SetPayload> {
  const user = await requireUser();
  const { weight, reps } = input;

  if (!Number.isFinite(weight) || weight < 0) {
    throw new Error("Weight must be a non-negative number.");
  }
  if (!Number.isInteger(reps) || reps <= 0) {
    throw new Error("Reps must be a positive integer.");
  }

  const exercise = await prisma.exerciseLog.findFirst({
    where: { id: input.exerciseLogId, workout: { userId: user.id } },
    select: { id: true },
  });
  if (!exercise) throw new Error("Exercise not found.");

  const lastSet = await prisma.setLog.findFirst({
    where: { exerciseLogId: exercise.id },
    orderBy: { setNumber: "desc" },
    select: { setNumber: true },
  });

  const set = await prisma.setLog.create({
    data: {
      exerciseLogId: exercise.id,
      setNumber: (lastSet?.setNumber ?? 0) + 1,
      weight,
      reps,
    },
  });

  revalidateApp();
  return {
    id: set.id,
    setNumber: set.setNumber,
    weight: set.weight,
    reps: set.reps,
  };
}

export async function deleteSet(setId: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.setLog.deleteMany({
    where: {
      id: setId,
      exerciseLog: { workout: { userId: user.id } },
    },
  });
  if (result.count === 0) throw new Error("Set not found.");
  revalidateApp();
}

export async function deleteExercise(exerciseLogId: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.exerciseLog.deleteMany({
    where: {
      id: exerciseLogId,
      workout: { userId: user.id },
    },
  });
  if (result.count === 0) throw new Error("Exercise not found.");
  revalidateApp();
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.workout.deleteMany({
    where: { id: workoutId, userId: user.id },
  });
  if (result.count === 0) throw new Error("Workout not found.");
  revalidateApp();
}