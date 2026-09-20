"use server";

import { requireUser } from "@/app/actions/auth";
import { isAdminUser } from "@/lib/auth-logic";
import { prisma } from "@/lib/prisma";
import { deleteUserRecord } from "@/lib/db/user";
import { revalidateApp } from "@/lib/revalidate";

export type AdminUserRow = {
  id: string;
  username: string;
  createdAt: string;
  gymDays: number;
  sports: number;
  supplements: number;
  sessions: number;
  lastGymDate: string | null;
  lastSportDate: string | null;
  lastSupplementDate: string | null;
};

async function requireAdmin() {
  const user = await requireUser();
  if (!isAdminUser(user.username)) {
    throw new Error("Admin only.");
  }
  return user;
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  await requireAdmin();
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      createdAt: true,
      _count: {
        select: {
          gymSessions: true,
          sports: true,
          supplements: true,
          sessions: true,
        },
      },
      gymSessions: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true },
      },
      sports: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true },
      },
      supplements: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    createdAt: row.createdAt.toISOString(),
    gymDays: row._count.gymSessions,
    sports: row._count.sports,
    supplements: row._count.supplements,
    sessions: row._count.sessions,
    lastGymDate: row.gymSessions[0]?.date ?? null,
    lastSportDate: row.sports[0]?.date ?? null,
    lastSupplementDate: row.supplements[0]?.date ?? null,
  }));
}

export async function deleteUserAsAdmin(
  userId: string,
): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  if (userId === admin.id) {
    return { error: "Use Account to delete your own user." };
  }
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!existing) return { error: "User not found." };
  await deleteUserRecord(userId);
  revalidateApp();
  return {};
}
