import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WeekGrid } from "@/components/analytics/WeekGrid";
import type { DailyActivityPoint } from "@/types/trackr";

const daily: DailyActivityPoint[] = [
  { date: "2026-09-14", gymLoad: 8, workouts: 1, sports: 0, supplements: 0 },
  { date: "2026-09-15", gymLoad: 0, workouts: 0, sports: 1, supplements: 0 },
  { date: "2026-09-16", gymLoad: 5, workouts: 1, sports: 1, supplements: 0 },
  { date: "2026-09-17", gymLoad: 0, workouts: 0, sports: 0, supplements: 0 },
];

describe("WeekGrid", () => {
  it("selects a week and reads gym, sport, and rest counts", () => {
    render(<WeekGrid data={daily} />);

    expect(
      screen.getByRole("button", {
        name: "Week of Sep 14, 2 gym, 2 sport, 1 rest",
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Sep 14–Sep 20 · 2 gym · 2 sport · 1 rest",
    );
  });
});
