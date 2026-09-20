"use server";

import type { PrismaClient } from "@prisma/client";
import { requireUser } from "@/app/actions/auth";
import { MAX_IMPORT_CHARS } from "@/lib/constants";
import {
  parseTrackrImport,
  sportIdentity,
  supplementIdentity,
  type NormalizedImport,
} from "@/lib/import-data";
import { nameKey } from "@/lib/names";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";

type DbClient = Omit<
  PrismaClient,
  | "$connect"
  | "$disconnect"
  | "$on"
  | "$transaction"
  | "$extends"
>;

export type ImportSummary = {
  musclesCreated: number;
  gymDaysMerged: number;
  hitsUpserted: number;
  sportsAdded: number;
  sportsSkipped: number;
  supplementsAdded: number;
  supplementsSkipped: number;
  exercisesUpserted: number;
  snapshotsUpserted: number;
  catalogSupplementsUpserted: number;
  preferencesUpdated: boolean;
};

export async function importMyData(
  raw: string,
): Promise<{ error: string } | { summary: ImportSummary }> {
  const user = await requireUser();
  if (raw.length > MAX_IMPORT_CHARS) {
    return { error: "Import file is too large." };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return { error: "That file is not valid JSON." };
  }

  const parsed = parseTrackrImport(parsedJson);
  if (!parsed.ok) return { error: parsed.error };

  const summary = await prisma.$transaction((tx) =>
    applyImport(tx, user.id, parsed.data),
  );
  revalidateApp();
  return { summary };
}

async function applyImport(
  tx: DbClient,
  userId: string,
  data: NormalizedImport,
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    musclesCreated: 0,
    gymDaysMerged: 0,
    hitsUpserted: 0,
    sportsAdded: 0,
    sportsSkipped: 0,
    supplementsAdded: 0,
    supplementsSkipped: 0,
    exercisesUpserted: 0,
    snapshotsUpserted: 0,
    catalogSupplementsUpserted: 0,
    preferencesUpdated: false,
  };

  if (data.preferences.massUnit || data.preferences.distanceUnit) {
    await tx.user.update({
      where: { id: userId },
      data: {
        ...(data.preferences.massUnit ? { massUnit: data.preferences.massUnit } : {}),
        ...(data.preferences.distanceUnit
          ? { distanceUnit: data.preferences.distanceUnit }
          : {}),
      },
    });
    summary.preferencesUpdated = true;
  }

  const muscles = await tx.muscle.findMany({ where: { userId } });
  const musclesByKey = new Map(muscles.map((row) => [row.nameKey, row]));
  let nextSort = muscles.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;

  async function ensureMuscle(name: string, sortOrder?: number) {
    const key = nameKey(name);
    const existing = musclesByKey.get(key);
    if (existing) return existing;
    const created = await tx.muscle.create({
      data: {
        userId,
        name,
        nameKey: key,
        sortOrder: sortOrder ?? nextSort,
      },
    });
    nextSort = Math.max(nextSort, created.sortOrder) + 1;
    musclesByKey.set(key, created);
    summary.musclesCreated += 1;
    return created;
  }

  for (const muscle of data.muscles) {
    await ensureMuscle(muscle.name, muscle.sortOrder);
  }

  for (const session of data.gymSessions) {
    const row = await tx.gymSession.upsert({
      where: { userId_date: { userId, date: session.date } },
      create: { userId, date: session.date, notes: session.notes },
      update: session.notes != null ? { notes: session.notes } : {},
    });
    summary.gymDaysMerged += 1;
    for (const hit of session.hits) {
      const muscle = await ensureMuscle(hit.muscleName);
      await tx.muscleHit.upsert({
        where: { sessionId_muscleId: { sessionId: row.id, muscleId: muscle.id } },
        create: {
          sessionId: row.id,
          muscleId: muscle.id,
          muscleName: muscle.name,
          intensity: hit.intensity,
        },
        update: { intensity: hit.intensity, muscleName: muscle.name },
      });
      summary.hitsUpserted += 1;
    }
  }

  const existingSports = await tx.sportSession.findMany({
    where: { userId },
    select: {
      date: true,
      type: true,
      durationMinutes: true,
      distanceKm: true,
      distanceMeters: true,
      pace: true,
      effort: true,
      notes: true,
    },
  });
  const sportKeys = new Set(existingSports.map(sportIdentity));
  for (const sport of data.sports) {
    const key = sportIdentity(sport);
    if (sportKeys.has(key)) {
      summary.sportsSkipped += 1;
      continue;
    }
    await tx.sportSession.create({
      data: { userId, ...sport },
    });
    sportKeys.add(key);
    summary.sportsAdded += 1;
  }

  const existingSupplements = await tx.supplementIntake.findMany({
    where: { userId },
    select: { name: true, dose: true, date: true },
  });
  const supplementKeys = new Set(existingSupplements.map(supplementIdentity));
  for (const item of data.supplements) {
    const key = supplementIdentity(item);
    if (supplementKeys.has(key)) {
      summary.supplementsSkipped += 1;
      continue;
    }
    await tx.supplementIntake.create({
      data: { userId, ...item },
    });
    supplementKeys.add(key);
    summary.supplementsAdded += 1;
  }

  const exercises = await tx.customExercise.findMany({ where: { userId } });
  const exercisesByKey = new Map(exercises.map((row) => [row.nameKey, row]));
  for (const item of data.exercises) {
    const key = nameKey(item.name);
    const muscle = item.muscleName ? await ensureMuscle(item.muscleName) : null;
    const existing = exercisesByKey.get(key);
    const payload = {
      name: item.name,
      nameKey: key,
      muscleId: muscle?.id ?? null,
      workingWeight: item.workingWeight,
      workingReps: item.workingReps,
      prWeight: item.prWeight,
      prReps: item.prReps,
      prDate: item.prDate,
      dualWeights:
        item.dualWeights === undefined
          ? existing?.dualWeights ?? false
          : item.dualWeights,
    };
    const saved = existing
      ? await tx.customExercise.update({
          where: { id: existing.id },
          data: payload,
        })
      : await tx.customExercise.create({
          data: { userId, ...payload },
        });
    exercisesByKey.set(key, saved);
    summary.exercisesUpserted += 1;
    for (const snap of item.snapshots) {
      await tx.exerciseSnapshot.upsert({
        where: { exerciseId_date: { exerciseId: saved.id, date: snap.date } },
        create: { exerciseId: saved.id, ...snap },
        update: {
          workingWeight: snap.workingWeight,
          workingReps: snap.workingReps,
          prWeight: snap.prWeight,
          prReps: snap.prReps,
        },
      });
      summary.snapshotsUpserted += 1;
    }
  }

  const catalogSupplements = await tx.customSupplement.findMany({
    where: { userId },
  });
  const supplementsByKey = new Map(
    catalogSupplements.map((row) => [row.nameKey, row]),
  );
  for (const item of data.customSupplements) {
    const key = nameKey(item.name);
    const existing = supplementsByKey.get(key);
    if (existing) {
      await tx.customSupplement.update({
        where: { id: existing.id },
        data: { name: item.name, defaultDose: item.defaultDose },
      });
    } else {
      const created = await tx.customSupplement.create({
        data: {
          userId,
          name: item.name,
          nameKey: key,
          defaultDose: item.defaultDose,
        },
      });
      supplementsByKey.set(key, created);
    }
    summary.catalogSupplementsUpserted += 1;
  }

  return summary;
}
