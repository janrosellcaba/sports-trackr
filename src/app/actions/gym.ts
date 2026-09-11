"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type SetPayload = {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
};

export type ExercisePayload = {
  id: string;
  machineName: string;
  order: number;
  sets: SetPayload[];
};

export type SessionPayload = {
  id: string;
  startTime: string;
  endTime: string | null;
  notes: string | null;
  exercises: ExercisePayload[];
};

function serializeSession(
  session: {
    id: string;
    startTime: Date;
    endTime: Date | null;
    notes: string | null;
    exercises: {
      id: string;
      machineName: string;
      order: number;
      sets: {
        id: string;
        setNumber: number;
        weight: number;
        reps: number;
        rpe: number | null;
      }[];
    }[];
  },
): SessionPayload {
  return {
    id: session.id,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime?.toISOString() ?? null,
    notes: session.notes,
    exercises: session.exercises.map((exercise) => ({
      id: exercise.id,
      machineName: exercise.machineName,
      order: exercise.order,
      sets: exercise.sets.map((set) => ({
        id: set.id,
        setNumber: set.setNumber,
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe,
      })),
    })),
  };
}

const activeSessionInclude = {
  exercises: {
    orderBy: { order: "asc" as const },
    include: {
      sets: {
        orderBy: { setNumber: "asc" as const },
      },
    },
  },
};

export async function startSession(): Promise<SessionPayload> {
  const existing = await prisma.workoutSession.findFirst({
    where: { endTime: null },
  });

  if (existing) {
    throw new Error("An active gym session already exists.");
  }

  const session = await prisma.workoutSession.create({
    data: {
      startTime: new Date(),
      endTime: null,
    },
    include: activeSessionInclude,
  });

  revalidatePath("/");
  return serializeSession(session);
}

export async function endSession(
  sessionId: string,
  notes?: string,
): Promise<SessionPayload> {
  const session = await prisma.workoutSession.update({
    where: { id: sessionId },
    data: {
      endTime: new Date(),
      ...(notes !== undefined ? { notes } : {}),
    },
    include: activeSessionInclude,
  });

  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/analytics");
  return serializeSession(session);
}

export async function getActiveSession(): Promise<SessionPayload | null> {
  const session = await prisma.workoutSession.findFirst({
    where: { endTime: null },
    include: activeSessionInclude,
    orderBy: { startTime: "desc" },
  });

  return session ? serializeSession(session) : null;
}

export async function addExercise(
  sessionId: string,
  machineName: string,
): Promise<ExercisePayload> {
  const trimmed = machineName.trim();
  if (!trimmed) {
    throw new Error("Exercise name is required.");
  }

  const lastExercise = await prisma.exerciseLog.findFirst({
    where: { sessionId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const exercise = await prisma.exerciseLog.create({
    data: {
      sessionId,
      machineName: trimmed,
      order: (lastExercise?.order ?? -1) + 1,
    },
    include: {
      sets: {
        orderBy: { setNumber: "asc" },
      },
    },
  });

  revalidatePath("/");
  return {
    id: exercise.id,
    machineName: exercise.machineName,
    order: exercise.order,
    sets: exercise.sets.map((set) => ({
      id: set.id,
      setNumber: set.setNumber,
      weight: set.weight,
      reps: set.reps,
      rpe: set.rpe,
    })),
  };
}

export async function addSet(
  exerciseLogId: string,
  weight: number,
  reps: number,
  rpe?: number,
): Promise<SetPayload> {
  if (!Number.isFinite(weight) || weight < 0) {
    throw new Error("Weight must be a non-negative number.");
  }
  if (!Number.isInteger(reps) || reps <= 0) {
    throw new Error("Reps must be a positive integer.");
  }
  if (rpe !== undefined && (rpe < 0 || rpe > 10)) {
    throw new Error("RPE must be between 0 and 10.");
  }

  const lastSet = await prisma.setLog.findFirst({
    where: { exerciseLogId },
    orderBy: { setNumber: "desc" },
    select: { setNumber: true },
  });

  const set = await prisma.setLog.create({
    data: {
      exerciseLogId,
      setNumber: (lastSet?.setNumber ?? 0) + 1,
      weight,
      reps,
      rpe: rpe ?? null,
    },
  });

  revalidatePath("/");
  return {
    id: set.id,
    setNumber: set.setNumber,
    weight: set.weight,
    reps: set.reps,
    rpe: set.rpe,
  };
}

export async function deleteSet(setId: string): Promise<void> {
  await prisma.setLog.delete({ where: { id: setId } });
  revalidatePath("/");
}

export async function deleteExercise(exerciseLogId: string): Promise<void> {
  await prisma.exerciseLog.delete({ where: { id: exerciseLogId } });
  revalidatePath("/");
}
