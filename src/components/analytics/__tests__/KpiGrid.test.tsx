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
  trends: {
    activity: 10,
    workouts: 0,
    gymLoad: -5,
    sports: 50,
    supplements: null,
  },
  daily: [],
  topMuscles: [],
};

describe("KpiGrid", () => {
  it("leads with activity days and weekly sport rhythm", () => {
    render(<KpiGrid summary={summary} />);

    expect(screen.getByText("Activity")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("4 gym · 3 sport · 5/wk")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("3/wk · 90 min · 8.2 km")).toBeInTheDocument();
  });
});
