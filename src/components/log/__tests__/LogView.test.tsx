import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LogView } from "@/components/log/LogView";
import type { GymSessionPayload } from "@/types/trackr";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/actions/gym", () => ({
  deleteGymSession: vi.fn(),
}));

vi.mock("@/app/actions/sports", () => ({
  deleteSport: vi.fn(),
}));

vi.mock("@/app/actions/supplements", () => ({
  deleteSupplement: vi.fn(),
}));

function gym(date: string): GymSessionPayload {
  return {
    id: `gym-${date}`,
    date,
    notes: null,
    hitCount: 1,
    totalLoad: 4,
    hits: [
      {
        id: `hit-${date}`,
        muscleId: "chest",
        muscleName: "Chest",
        intensity: 4,
      },
    ],
  };
}

describe("LogView trainer copy", () => {
  it("copies gym, sport, supplements, and weight for the selected range", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, "writeText").mockImplementation(writeText);

    render(
      <LogView
        today="2026-10-06"
        gymSessions={[gym("2026-10-06"), gym("2026-08-01")]}
        sports={[
          {
            id: "run",
            date: "2026-10-06",
            type: "RUNNING",
            durationMinutes: 32,
            distanceKm: 5,
            distanceMeters: null,
            pace: "5:30",
            effort: "EASY",
            notes: null,
          },
        ]}
        supplements={[{ id: "creatine", name: "Creatine", dose: "5 g", date: "2026-10-06" }]}
        bodyWeights={[{ id: "w", date: "2026-10-06", weightKg: 82.5 }]}
        muscles={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Copy JSON for the last 30 sessions" }));
    const sessions = JSON.parse(writeText.mock.calls[0][0] as string) as {
      days: Array<{ date: string }>;
    };
    expect(sessions.days.map((day) => day.date)).toEqual(["2026-08-01", "2026-10-06"]);
    expect(writeText.mock.calls[0][0]).toContain('"name": "Chest"');
    expect(writeText.mock.calls[0][0]).toContain('"sport": "Running"');
    expect(writeText.mock.calls[0][0]).toContain('"name": "Creatine"');
    expect(writeText.mock.calls[0][0]).toContain('"weightKg": 82.5');

    await user.click(screen.getByRole("button", { name: "30 days" }));
    await user.click(screen.getByRole("button", { name: "Copy JSON for the last 30 days" }));
    const month = JSON.parse(writeText.mock.calls[1][0] as string) as {
      days: Array<{ date: string }>;
    };
    expect(month.days.map((day) => day.date)).toEqual(["2026-10-06"]);
  });
});
