import { describe, expect, it } from "vitest";
import { addDaysISO } from "@/lib/calculations";
import { buildTrainerLog } from "@/lib/trainer-log";
import type {
  BodyWeightPayload,
  GymSessionPayload,
  SportSessionPayload,
  SupplementPayload,
} from "@/types/trackr";

const today = "2026-10-06";

function gym(
  date: string,
  hits: Array<{ muscleName: string; intensity: number }>,
  notes: string | null = null,
): GymSessionPayload {
  return {
    id: `gym-${date}`,
    date,
    notes,
    hitCount: hits.length,
    totalLoad: hits.reduce((sum, hit) => sum + hit.intensity, 0),
    hits: hits.map((hit, index) => ({
      id: `hit-${date}-${index}`,
      muscleId: hit.muscleName,
      muscleName: hit.muscleName,
      intensity: hit.intensity,
    })),
  };
}

function sport(
  date: string,
  overrides: Partial<SportSessionPayload> = {},
): SportSessionPayload {
  return {
    id: `sport-${date}`,
    date,
    type: "RUNNING",
    durationMinutes: null,
    distanceKm: null,
    distanceMeters: null,
    pace: null,
    effort: null,
    notes: null,
    ...overrides,
  };
}

function supplement(date: string, name: string, dose: string): SupplementPayload {
  return { id: `supp-${date}-${name}`, date, name, dose };
}

function weight(date: string, weightKg: number): BodyWeightPayload {
  return { id: `w-${date}`, date, weightKg };
}

describe("buildTrainerLog", () => {
  it("keeps the last 30 training days and the supplements and weigh-ins between them", () => {
    const gymSessions = Array.from({ length: 40 }, (_, index) =>
      gym(addDaysISO(today, -(39 - index)), [
        { muscleName: "Back", intensity: 2 },
        { muscleName: "Chest", intensity: 4 },
      ]),
    );
    const inside = addDaysISO(today, -10);
    const outside = addDaysISO(today, -35);

    const log = buildTrainerLog(
      {
        today,
        gymSessions,
        sports: [sport(today, { distanceKm: 5.4, pace: "5:55", effort: "HARD", notes: " easy " })],
        supplements: [
          supplement(inside, "Creatine", "5 g"),
          supplement(outside, "Creatine", "5 g"),
        ],
        bodyWeights: [weight(inside, 81.4), weight("2026-01-01", 79)],
      },
      "sessions-30",
    );

    expect(log.range).toBe("last 30 sessions");
    expect(log.from).toBe(addDaysISO(today, -29));
    expect(log.to).toBe(today);
    expect(log.trainingDays).toBe(30);
    expect(log.days[0]?.date).toBe(addDaysISO(today, -29));
    expect(log.days.at(-1)?.date).toBe(today);
    expect(log.days.some((day) => day.date === outside)).toBe(false);
    expect(log.days.find((day) => day.date === inside)?.supplements).toEqual([
      { name: "Creatine", dose: "5 g" },
    ]);
    expect(log.days.find((day) => day.date === inside)?.weightKg).toBe(81.4);
    expect(log.latestWeight).toEqual({ date: inside, weightKg: 81.4 });
    expect(log.days.at(-1)?.gym?.muscles).toEqual([
      { name: "Chest", intensity: 4, level: "Hard" },
      { name: "Back", intensity: 2, level: "Steady" },
    ]);
    expect(log.days.at(-1)?.sports).toEqual([
      {
        sport: "Running",
        distanceKm: 5.4,
        paceMinPerKm: "5:55",
        effort: "Hard",
        notes: "easy",
      },
    ]);
  });

  it("includes rest-day supplements and weigh-ins inside a shorter session span", () => {
    const log = buildTrainerLog(
      {
        today,
        gymSessions: [gym("2026-09-01", [{ muscleName: "Quads", intensity: 3 }], "  ")],
        sports: [sport(today, { type: "PADEL", durationMinutes: 90, effort: "MODERATE" })],
        supplements: [supplement("2026-09-15", "Vitamin D", "1 pill")],
        bodyWeights: [weight("2026-09-20", 82)],
      },
      "sessions-30",
    );

    expect(log.from).toBe("2026-09-01");
    expect(log.trainingDays).toBe(2);
    expect(log.days.map((day) => day.date)).toEqual([
      "2026-09-01",
      "2026-09-15",
      "2026-09-20",
      today,
    ]);
    expect(log.days[0]?.gym).toEqual({
      muscles: [{ name: "Quads", intensity: 3, level: "Solid" }],
    });
    expect(log.days.at(-1)?.sports?.[0]).toEqual({
      sport: "Padel",
      durationMinutes: 90,
      effort: "Moderate",
    });
  });

  it("limits calendar ranges to the last 30 or 60 days", () => {
    const input = {
      today,
      gymSessions: [
        gym("2026-08-08", [{ muscleName: "Chest", intensity: 1 }]),
        gym("2026-08-07", [{ muscleName: "Chest", intensity: 1 }]),
        gym("2026-09-07", [{ muscleName: "Chest", intensity: 5 }]),
        gym("2026-09-06", [{ muscleName: "Chest", intensity: 5 }]),
      ],
      sports: [] as SportSessionPayload[],
      supplements: [] as SupplementPayload[],
      bodyWeights: [weight("2025-12-01", 77.2)],
    };

    const month = buildTrainerLog(input, "days-30");
    expect(month.from).toBe("2026-09-07");
    expect(month.days.map((day) => day.date)).toEqual(["2026-09-07"]);
    expect(month.latestWeight).toEqual({ date: "2025-12-01", weightKg: 77.2 });
    expect(month.days[0]?.weightKg).toBeUndefined();

    const twoMonths = buildTrainerLog(input, "days-60");
    expect(twoMonths.from).toBe("2026-08-08");
    expect(twoMonths.days.map((day) => day.date)).toEqual([
      "2026-08-08",
      "2026-09-06",
      "2026-09-07",
    ]);
  });

  it("ignores future logs and returns an empty packet when nothing is in range", () => {
    const log = buildTrainerLog(
      {
        today,
        gymSessions: [gym("2026-10-07", [{ muscleName: "Chest", intensity: 3 }])],
        sports: [],
        supplements: [supplement("2026-09-01", "Creatine", "5 g")],
        bodyWeights: [],
      },
      "sessions-30",
    );

    expect(log.from).toBeNull();
    expect(log.trainingDays).toBe(0);
    expect(log.days).toEqual([]);
    expect(log.latestWeight).toBeUndefined();
  });
});
