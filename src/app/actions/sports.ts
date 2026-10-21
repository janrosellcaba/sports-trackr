"use server";

import { requireUser } from "@/app/actions/auth";
import { isDateKey } from "@/lib/calculations";
import { listSportCatalog } from "@/lib/db/activity";
import { getRequestToday } from "@/lib/request-today";
import { nameKey } from "@/lib/names";
import { prisma } from "@/lib/prisma";
import { isUniqueConstraintError } from "@/lib/prisma-errors";
import { ensureSportsCatalog } from "@/lib/seed-catalog";
import {
  decodeSportFields,
  encodeSportFields,
  parseSportFields,
  parseSportName,
  parseSportSessionInput,
  sameSportName,
} from "@/lib/sports";
import { revalidateApp } from "@/lib/revalidate";
import {
  listSportsForDate,
  listSportsForUser,
  serializeSport,
} from "@/lib/db/activity";
import type { SportCatalogPayload, SportSessionPayload } from "@/types/trackr";

async function definitionFor(userId: string, type: string) {
  await ensureSportsCatalog(userId);
  const sport = await prisma.sport.findFirst({
    where: { userId, nameKey: type },
  });
  if (!sport) throw new Error("Unknown sport.");
  return {
    id: sport.nameKey,
    label: sport.name,
    fields: decodeSportFields(sport.fields),
  };
}

export async function logSport(input: {
  type: string;
  date?: string;
  durationMinutes?: number | null;
  distanceKm?: number | null;
  distanceMeters?: number | null;
  pace?: string | null;
  effort?: string | null;
  notes?: string | null;
}): Promise<SportSessionPayload> {
  const user = await requireUser();
  const date = input.date ?? (await getRequestToday());
  const parsed = parseSportSessionInput(
    { ...input, date },
    await definitionFor(user.id, input.type),
  );

  const row = await prisma.sportSession.create({
    data: {
      userId: user.id,
      date: parsed.date,
      type: parsed.type,
      durationMinutes: parsed.durationMinutes,
      distanceKm: parsed.distanceKm,
      distanceMeters: parsed.distanceMeters,
      pace: parsed.pace,
      effort: parsed.effort,
      notes: parsed.notes,
    },
  });

  revalidateApp();
  return serializeSport(row);
}

export async function updateSport(
  id: string,
  input: {
    type: string;
    date?: string;
    durationMinutes?: number | null;
    distanceKm?: number | null;
    distanceMeters?: number | null;
    pace?: string | null;
    effort?: string | null;
    notes?: string | null;
  },
): Promise<SportSessionPayload> {
  const user = await requireUser();
  const date = input.date ?? (await getRequestToday());
  const parsed = parseSportSessionInput(
    { ...input, date },
    await definitionFor(user.id, input.type),
  );

  const existing = await prisma.sportSession.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new Error("Sport session not found.");

  const row = await prisma.sportSession.update({
    where: { id },
    data: {
      date: parsed.date,
      type: parsed.type,
      durationMinutes: parsed.durationMinutes,
      distanceKm: parsed.distanceKm,
      distanceMeters: parsed.distanceMeters,
      pace: parsed.pace,
      effort: parsed.effort,
      notes: parsed.notes,
    },
  });

  revalidateApp();
  return serializeSport(row);
}

export async function listSports(): Promise<SportSessionPayload[]> {
  const user = await requireUser();
  const rows = await listSportsForUser(user.id);
  return rows.map(serializeSport);
}

export async function getSportsForDate(
  date?: string,
): Promise<SportSessionPayload[]> {
  const user = await requireUser();
  const resolved = date ?? (await getRequestToday());
  if (!isDateKey(resolved)) throw new Error("Invalid date.");
  const rows = await listSportsForDate(user.id, resolved);
  return rows.map(serializeSport);
}

export async function listSportCatalogForUser(
  userId: string,
): Promise<SportCatalogPayload[]> {
  await ensureSportsCatalog(userId);
  return listSportCatalog(userId);
}

export async function createSport(input: {
  name: string;
  fields: string[];
}): Promise<SportCatalogPayload> {
  const user = await requireUser();
  await ensureSportsCatalog(user.id);
  const name = parseSportName(input.name);
  const fields = parseSportFields(input.fields);
  const existing = await prisma.sport.findMany({
    where: { userId: user.id },
    select: { name: true, sortOrder: true },
  });
  if (existing.some((item) => sameSportName(item.name, name))) {
    throw new Error("A sport with that name already exists.");
  }
  const sortOrder = existing.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
  try {
    const row = await prisma.sport.create({
      data: {
        userId: user.id,
        name,
        nameKey: nameKey(name),
        fields: encodeSportFields(fields),
        sortOrder,
      },
    });
    revalidateApp();
    return {
      id: row.id,
      name: row.name,
      nameKey: row.nameKey,
      fields: decodeSportFields(row.fields),
      sortOrder: row.sortOrder,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new Error("A sport with that name already exists.");
    }
    throw error;
  }
}

export async function updateSportCatalog(input: {
  id: string;
  name: string;
  fields: string[];
}): Promise<SportCatalogPayload> {
  const user = await requireUser();
  const name = parseSportName(input.name);
  const fields = parseSportFields(input.fields);
  const existing = await prisma.sport.findFirst({
    where: { id: input.id, userId: user.id },
  });
  if (!existing) throw new Error("Sport not found.");

  const others = await prisma.sport.findMany({
    where: { userId: user.id, id: { not: input.id } },
    select: { name: true },
  });
  if (others.some((item) => sameSportName(item.name, name))) {
    throw new Error("A sport with that name already exists.");
  }

  const nextKey = sameSportName(existing.name, name) ? existing.nameKey : nameKey(name);
  const row = await prisma.sport.update({
    where: { id: existing.id },
    data: { name, nameKey: nextKey, fields: encodeSportFields(fields) },
  });
  if (nextKey !== existing.nameKey) {
    await prisma.sportSession.updateMany({
      where: { userId: user.id, type: existing.nameKey },
      data: { type: nextKey },
    });
  }
  revalidateApp();
  return {
    id: row.id,
    name: row.name,
    nameKey: row.nameKey,
    fields: decodeSportFields(row.fields),
    sortOrder: row.sortOrder,
  };
}

export async function deleteSportCatalog(id: string): Promise<void> {
  const user = await requireUser();
  const sport = await prisma.sport.findFirst({
    where: { id, userId: user.id },
  });
  if (!sport) throw new Error("Sport not found.");
  const logged = await prisma.sportSession.count({
    where: { userId: user.id, type: sport.nameKey },
  });
  if (logged > 0) {
    throw new Error("This sport is still on a log. Remove those sessions first.");
  }
  await prisma.sport.delete({ where: { id: sport.id } });
  revalidateApp();
}

export async function moveSport(
  id: string,
  direction: "up" | "down",
): Promise<SportCatalogPayload[]> {
  const user = await requireUser();
  const rows = await prisma.sport.findMany({
    where: { userId: user.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const index = rows.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Sport not found.");
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= rows.length) return listSportCatalog(user.id);

  const current = rows[index];
  const other = rows[swapWith];
  await prisma.$transaction([
    prisma.sport.update({
      where: { id: current.id },
      data: { sortOrder: other.sortOrder },
    }),
    prisma.sport.update({
      where: { id: other.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);
  revalidateApp();
  return listSportCatalog(user.id);
}

export async function deleteSport(id: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.sportSession.deleteMany({
    where: { id, userId: user.id },
  });
  if (result.count === 0) throw new Error("Sport session not found.");
  revalidateApp();
}
