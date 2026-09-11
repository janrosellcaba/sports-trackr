"use server";

import { getCurrentUser } from "@/app/actions/auth";
import { isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AdminStats, AdminUserRow } from "@/types/trackr";

function latestDate(dates: (Date | null | undefined)[]): Date | null {
  let latest: Date | null = null;
  for (const date of dates) {
    if (!date) continue;
    if (!latest || date > latest) latest = date;
  }
  return latest;
}

export async function getAdminStats(): Promise<AdminStats> {
  const user = await getCurrentUser();
  if (!user || !isAdminUser(user)) {
    throw new Error("Unauthorized");
  }

  const [totalUsers, totalWorkouts, totalCardio, users] = await Promise.all([
    prisma.user.count(),
    prisma.workoutSession.count(),
    prisma.cardioActivity.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        sessions: {
          select: { startTime: true, endTime: true },
        },
        activities: {
          select: { date: true },
        },
        supplements: {
          select: { date: true },
        },
      },
    }),
  ]);

  return {
    totalUsers,
    totalWorkouts,
    totalCardio,
    users: users.map((row): AdminUserRow => {
      const lastActive = latestDate([
        ...row.sessions.map((session) => session.endTime ?? session.startTime),
        ...row.activities.map((activity) => activity.date),
        ...row.supplements.map((intake) => intake.date),
        row.createdAt,
      ]);

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        createdAt: row.createdAt.toISOString(),
        totalWorkoutsCount: row.sessions.length,
        lastActiveDate: lastActive?.toISOString() ?? null,
      };
    }),
  };
}
