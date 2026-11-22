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
  chartLabel: "Activity",
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
  shape: [],
};

describe("KpiGrid", () => {
  it("shows active days and weekly load against the previous period", () => {
    render(<KpiGrid summary={summary} />);

    expect(screen.getByText("Active days")).toBeInTheDocument();
    expect(screen.getByText("of 7 days")).toBeInTheDocument();
    expect(screen.getByText("+1 vs prev")).toBeInTheDocument();
    expect(screen.getByText("Load per week")).toBeInTheDocument();
    expect(screen.getByText("28")).toBeInTheDocument();
    expect(screen.getByText("28 in total")).toBeInTheDocument();
    expect(screen.getByText("Spike +40%")).toBeInTheDocument();
    expect(screen.queryByText("Sports")).not.toBeInTheDocument();
  });

  it("scales load to a week for longer periods", () => {
    render(<KpiGrid summary={{ ...summary, days: 30, totalGymLoad: 60, previous: { activityDays: 5, gymLoad: 60 } }} />);
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});
