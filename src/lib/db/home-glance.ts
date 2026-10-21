import { weekStrip, type WeekDayCell } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { buildShapeSeries, shapeDoses, shapeReadout } from "@/lib/shape";

export type HomeGlance = {
  shape: { score: number; weekChange: number | null } | null;
  week: WeekDayCell[];
};

export async function loadHomeGlance(
  userId: string,
  date: string,
  today: string,
): Promise<HomeGlance> {
  const [gym, sports, prs, snapshots] = await Promise.all([
    prisma.gymSession.findMany({
      where: { userId, date: { lte: today } },
      select: { date: true, hits: { select: { intensity: true } } },
    }),
    prisma.sportSession.findMany({
      where: { userId, date: { lte: today } },
      select: {
        date: true,
        durationMinutes: true,
        distanceKm: true,
        pace: true,
        effort: true,
      },
    }),
    prisma.customExercise.findMany({
      where: { userId, prDate: { not: null, lte: today } },
      select: { prDate: true },
    }),
    prisma.exerciseSnapshot.findMany({
      where: {
        prWeight: { not: null },
        date: { lte: today },
        exercise: { userId },
      },
      select: { date: true },
    }),
  ]);

  const doses = shapeDoses(
    gym.filter((session) => session.date <= date),
    sports.filter((session) => session.date <= date),
    snapshots.filter((row) => row.date <= date),
    prs.filter((row) => row.prDate != null && row.prDate <= date),
  );

  return {
    shape: shapeReadout(buildShapeSeries(doses, date)),
    week: weekStrip(
      date,
      today,
      gym.map((session) => session.date),
      sports.map((session) => session.date),
    ),
  };
}
