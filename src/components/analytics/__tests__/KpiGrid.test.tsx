import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KpiGrid } from "@/components/analytics/KpiGrid";
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
  chartLabel: "Load",
  previous: { activityDays: 4, gymLoad: 20 },
  trends: {
    activity: 10,
    workouts: 0,
    gymLoad: -5,
    sports: 50,
    supplements: null,
  },
  daily: [],
  topMuscles: [],
  weights: [],
};

describe("KpiGrid", () => {
  it("keeps activity and load, with rest and vs counts", () => {
    render(<KpiGrid summary={summary} />);

    expect(screen.getByText("Activity")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("5 on · 2 off")).toBeInTheDocument();
    expect(screen.getByText("5 vs 4")).toBeInTheDocument();
    expect(screen.getByText("Load")).toBeInTheDocument();
    expect(screen.getByText("28 vs 20")).toBeInTheDocument();
    expect(screen.queryByText("Sports")).not.toBeInTheDocument();
    expect(screen.queryByText("4 gym · 3 sport · 5/wk")).not.toBeInTheDocument();
  });
});
