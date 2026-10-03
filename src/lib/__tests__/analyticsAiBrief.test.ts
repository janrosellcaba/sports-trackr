import { formatLift } from "@/lib/catalog";
import { buildActivityWeeks, perWeekRate, weekCounts } from "@/lib/analytics";
import { kmToDisplay, trimNumber } from "@/lib/units";
import { describe, expect, it } from "vitest";
import { buildAnalyticsAiBrief } from "@/lib/analyticsAiBrief";
import { trainerPayload } from "@/lib/trainerPayload";
import type { AnalyticsSummary } from "@/types/trackr";

const summary: AnalyticsSummary = {
  days: 7,
  periodLabel: "Last 7 days",
  activityDays: 5,
  gymDays: 4,
  sportDays: 3,
  restDays: 2,
  totalWorkouts: 4,
  totalHits: 12,
  totalGymLoad: 28,
  totalSports: 3,
  totalSportMinutes: 90,
  totalSportKm: 8.2,
  supplementDays: 6,
  supplementStreak: 2,
  gymStreak: 1,
  sportStreak: 0,
  chartLabel: "Activity",
  previous: { activityDays: 4, gymLoad: 20 },
  trends: {
    activity: 10,
    workouts: 0,
    gymLoad: -5,
    sports: 50,
    supplements: null,
  },
  daily: [
    { date: "2026-09-14", gymLoad: 8, workouts: 1, sports: 0, supplements: 1 },
  ],
  topMuscles: [{ name: "Chest", load: 12, hits: 3, days: 2, avgIntensity: 4 }],
  weights: [],
  shape: [],
};

describe("trainerPayload", () => {
  it("keeps the trainer snapshot keys", () => {
    const payload = trainerPayload(summary, [], "kg", "km");
    expect(payload.period).toBe("Last 7 days");
    expect(payload.units).toEqual({ mass: "kg", distance: "km" });
    expect(payload.activity.days).toBe(5);
    expect(payload.gym.load).toBe(28);
    expect(payload.sports.distance).toBe(trimNumber(kmToDisplay(8.2, "km")));
    expect(payload.weeks).toEqual(
      buildActivityWeeks(summary.daily).map((week) => ({
        start: week.start,
        ...weekCounts(week),
      })),
    );
  });
});

describe("buildAnalyticsAiBrief", () => {
  it("writes a coach brief with commented snapshot fields", () => {
    const payload = trainerPayload(
      summary,
      [
        {
          id: "e1",
          name: "Bench",
          prWeight: 100,
          prReps: 5,
          prDate: "2026-09-14",
          dualWeights: false,
        },
      ],
      "kg",
      "km",
    );
    const brief = buildAnalyticsAiBrief(payload, {
      generatedAt: "2026-10-03",
      language: "English",
    });

    expect(brief).toContain("strength-and-conditioning coach");
    expect(brief).toContain("SNAPSHOT (commented JSON)");
    expect(brief).toContain('"generatedAt": "2026-10-03"');
    expect(brief).toContain('"language": "English"');
    expect(brief).toContain("When this copy was made (UTC date)");
    expect(brief).toContain("A piece is omitted (null) when there is not enough data");
    expect(brief).toContain(formatLift(100, 5, "kg", false));
    expect(brief).toContain(payload.legend.gymLoad);
    expect(brief).not.toContain("personal-finance");
    expect(perWeekRate(5, 7)).toBe(5);
  });
});
