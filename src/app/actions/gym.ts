"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { parseSessionTimes } from "@/lib/session-times";
import type {
  ExercisePayload,
  SessionPayload,
  SetPayload,
} from "@/types/trackr";

function serializeSession(
  session: {
    id: string;
    startTime: Date;
    endTime: Date | null;
    notes: string | null;
    mode?: string | null;
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
    mode: session.mode === "MANUAL" ? "MANUAL" : "LIVE",
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

function revalidateGym() {
  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/analytics");
}

export async function startSession(options?: {
  id?: string;
  startTime?: string;
}): Promise<SessionPayload> {
  const user = await requireUser();

  if (options?.id) {
    const existingById = await prisma.workoutSession.findFirst({
      where: { id: options.id, userId: user.id },
      include: activeSessionInclude,
    });
    if (existingById) return serializeSession(existingById);
  }

  const existing = await prisma.workoutSession.findFirst({
    where: { userId: user.id, endTime: null },
  });

  if (existing) {
    throw new Error("An active gym session already exists.");
  }

  const times = parseSessionTimes({
    startTime: options?.startTime ?? new Date().toISOString(),
  });
  if (times.error) throw new Error(times.error);

  const session = await prisma.workoutSession.create({
    data: {
      ...(options?.id ? { id: options.id } : {}),
      userId: user.id,
      startTime: times.start,
      endTime: null,
      mode: "LIVE",
    },
    include: activeSessionInclude,
  });

  revalidatePath("/");
  return serializeSession(session);
}

export async function createManualSession(options: {
  id?: string;
  startTime: string;
  endTime: string;
  notes?: string;
}): Promise<SessionPayload> {
  const user = await requireUser();
  const times = parseSessionTimes({
    startTime: options.startTime,
    endTime: options.endTime,
  });
  if (times.error) throw new Error(times.error);
  if (!times.end) throw new Error("End time is required for a past workout.");

  if (options.id) {
    const existing = await prisma.workoutSession.findFirst({
      where: { id: options.id, userId: user.id },
      include: activeSessionInclude,
    });
    if (existing) return serializeSession(existing);
  }

  const session = await prisma.workoutSession.create({
    data: {
      ...(options.id ? { id: options.id } : {}),
      userId: user.id,
      startTime: times.start,
      endTime: times.end,
      notes: options.notes?.trim() || null,
      mode: "MANUAL",
    },
    include: activeSessionInclude,
  });

  revalidateGym();
  return serializeSession(session);
}

export async function updateSessionTimes(
  sessionId: string,
  options: { startTime: string; endTime?: string | null; notes?: string },
): Promise<SessionPayload> {
  const user = await requireUser();
  const existing = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new Error("Session not found.");

  const times = parseSessionTimes({
    startTime: options.startTime,
    endTime: options.endTime,
  });
  if (times.error) throw new Error(times.error);

  const session = await prisma.workoutSession.update({
    where: { id: sessionId },
    data: {
      startTime: times.start,
      endTime: times.end,
      ...(options.notes !== undefined
        ? { notes: options.notes.trim() || null }
        : {}),
    },
    include: activeSessionInclude,
  });

  revalidateGym();
  return serializeSession(session);
}

export async function endSession(
  sessionId: string,
  options?: { notes?: string; endTime?: string },
): Promise<SessionPayload> {
  const user = await requireUser();
  const existing = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId: user.id },
    select: { id: true, startTime: true },
  });

  if (!existing) {
    throw new Error("Session not found.");
  }

  const times = parseSessionTimes({
    startTime: existing.startTime,
    endTime: options?.endTime ?? new Date().toISOString(),
  });
  if (times.error) throw new Error(times.error);

  const session = await prisma.workoutSession.update({
    where: { id: sessionId },
    data: {
      endTime: times.end,
      ...(options?.notes !== undefined ? { notes: options.notes } : {}),
    },
    include: activeSessionInclude,
  });

  revalidateGym();
  return serializeSession(session);
}

export async function getActiveSession(): Promise<SessionPayload | null> {
  const user = await requireUser();
  const session = await prisma.workoutSession.findFirst({
    where: { userId: user.id, endTime: null },
    include: activeSessionInclude,
    orderBy: { startTime: "desc" },
  });

  return session ? serializeSession(session) : null;
}

export async function getSession(sessionId: string): Promise<SessionPayload | null> {
  const user = await requireUser();
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: activeSessionInclude,
  });
  return session ? serializeSession(session) : null;
}

export async function addExercise(
  sessionId: string,
  machineName: string,
  options?: { id?: string },
): Promise<ExercisePayload> {
  const user = await requireUser();
  const trimmed = machineName.trim();
  if (!trimmed) {
    throw new Error("Exercise name is required.");
  }

  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId: user.id },
    select: { id: true },
  });

  if (!session) {
    throw new Error("Session not found.");
  }

  if (options?.id) {
    const existing = await prisma.exerciseLog.findFirst({
      where: { id: options.id, sessionId },
      include: { sets: { orderBy: { setNumber: "asc" } } },
    });
    if (existing) {
      return {
        id: existing.id,
        machineName: existing.machineName,
        order: existing.order,
        sets: existing.sets.map((set) => ({
          id: set.id,
          setNumber: set.setNumber,
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe,
        })),
      };
    }
  }

  const lastExercise = await prisma.exerciseLog.findFirst({
    where: { sessionId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const exercise = await prisma.exerciseLog.create({
    data: {
      ...(options?.id ? { id: options.id } : {}),
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
  revalidatePath("/history");
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
  options?: { id?: string },
): Promise<SetPayload> {
  const user = await requireUser();

  if (!Number.isFinite(weight) || weight < 0) {
    throw new Error("Weight must be a non-negative number.");
  }
  if (!Number.isInteger(reps) || reps <= 0) {
    throw new Error("Reps must be a positive integer.");
  }
  if (rpe !== undefined && (rpe < 0 || rpe > 10)) {
    throw new Error("RPE must be between 0 and 10.");
  }

  const exercise = await prisma.exerciseLog.findFirst({
    where: { id: exerciseLogId, session: { userId: user.id } },
    select: { id: true },
  });

  if (!exercise) {
    throw new Error("Exercise not found.");
  }

  if (options?.id) {
    const existing = await prisma.setLog.findFirst({
      where: { id: options.id, exerciseLogId },
    });
    if (existing) {
      return {
        id: existing.id,
        setNumber: existing.setNumber,
        weight: existing.weight,
        reps: existing.reps,
        rpe: existing.rpe,
      };
    }
  }

  const lastSet = await prisma.setLog.findFirst({
    where: { exerciseLogId },
    orderBy: { setNumber: "desc" },
    select: { setNumber: true },
  });

  const set = await prisma.setLog.create({
    data: {
      ...(options?.id ? { id: options.id } : {}),
      exerciseLogId,
      setNumber: (lastSet?.setNumber ?? 0) + 1,
      weight,
      reps,
      rpe: rpe ?? null,
    },
  });

  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/analytics");
  return {
    id: set.id,
    setNumber: set.setNumber,
    weight: set.weight,
    reps: set.reps,
    rpe: set.rpe,
  };
}

export async function deleteSet(setId: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.setLog.deleteMany({
    where: {
      id: setId,
      exerciseLog: { session: { userId: user.id } },
    },
  });

  if (result.count === 0) {
    throw new Error("Set not found.");
  }

  revalidatePath("/");
  revalidatePath("/history");
}

export async function deleteExercise(exerciseLogId: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.exerciseLog.deleteMany({
    where: {
      id: exerciseLogId,
      session: { userId: user.id },
    },
  });

  if (result.count === 0) {
    throw new Error("Exercise not found.");
  }

  revalidatePath("/");
  revalidatePath("/history");
}
