"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import {
  CARDIO_TYPES,
  INTENSITY_LEVELS,
  type CardioActivityPayload,
  type CardioType,
  type IntensityLevel,
  type LogCardioActivityInput,
} from "@/types/trackr";

function serializeActivity(activity: {
  id: string;
  type: string;
  durationMinutes: number;
  intensity: string;
  notes: string | null;
  date: Date;
}): CardioActivityPayload {
  return {
    id: activity.id,
    type: activity.type as CardioType,
    durationMinutes: activity.durationMinutes,
    intensity: activity.intensity as IntensityLevel,
    notes: activity.notes,
    date: activity.date.toISOString(),
  };
}

export async function logCardioActivity(
  data: LogCardioActivityInput,
): Promise<CardioActivityPayload> {
  const user = await requireUser();

  if (!CARDIO_TYPES.includes(data.type)) {
    throw new Error("Invalid activity type.");
  }
  if (!INTENSITY_LEVELS.includes(data.intensity)) {
    throw new Error("Invalid intensity.");
  }
  if (!Number.isFinite(data.durationMinutes) || data.durationMinutes <= 0) {
    throw new Error("Duration must be a positive number of minutes.");
  }

  const activity = await prisma.cardioActivity.create({
    data: {
      userId: user.id,
      type: data.type,
      durationMinutes: Math.round(data.durationMinutes),
      intensity: data.intensity,
      notes: data.notes?.trim() || null,
      date: data.date ? new Date(data.date) : new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/analytics");
  return serializeActivity(activity);
}

export async function getRecentActivities(
  limit = 10,
): Promise<CardioActivityPayload[]> {
  const user = await requireUser();
  const activities = await prisma.cardioActivity.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: Math.max(1, Math.min(limit, 50)),
  });

  return activities.map(serializeActivity);
}

export async function deleteCardioActivity(id: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.cardioActivity.deleteMany({
    where: { id, userId: user.id },
  });

  if (result.count === 0) {
    throw new Error("Activity not found.");
  }

  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/analytics");
}
