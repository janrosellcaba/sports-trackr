"use server";

import { getCurrentUser } from "@/app/actions/auth";
import { isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AdminStats } from "@/types/trackr";

export async function getAdminStats(): Promise<AdminStats> {
  const user = await getCurrentUser();
  if (!user || !isAdminUser(user)) {
    throw new Error("Unauthorized");
  }

  const [totalUsers, totalWorkouts, totalCardio, usersList] = await Promise.all(
    [
      prisma.user.count(),
      prisma.workoutSession.count(),
      prisma.cardioActivity.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              sessions: true,
              activities: true,
            },
          },
        },
      }),
    ],
  );

  return {
    totalUsers,
    totalWorkouts,
    totalCardio,
    usersList: usersList.map((row) => ({
      id: row.id,
      username: row.username,
      role: row.role,
      createdAt: row.createdAt.toISOString(),
      _count: row._count,
    })),
  };
}
