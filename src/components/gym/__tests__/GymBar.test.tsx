import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GymBar } from "@/components/gym/GymBar";

vi.mock("@/app/actions/gym", () => ({
  upsertMuscleHit: vi.fn(),
  deleteMuscleHit: vi.fn(),
}));

describe("GymBar", () => {
  it("lets a second muscle stay tappable while another undo is in flight", async () => {
    const user = userEvent.setup();
    render(
      <GymBar
        date="2026-09-16"
        muscles={[
          {
            id: "m1",
            name: "Chest",
            sortOrder: 0,
            createdAt: "2026-09-16T00:00:00.000Z",
          },
          {
            id: "m2",
            name: "Back",
            sortOrder: 1,
            createdAt: "2026-09-16T00:00:00.000Z",
          },
        ]}
        session={{
          id: "s1",
          date: "2026-09-16",
          notes: null,
          hitCount: 1,
          totalLoad: 4,
          hits: [
            {
              id: "h1",
              muscleId: "m1",
              muscleName: "Chest",
              intensity: 4,
            },
          ],
        }}
        onChange={() => undefined}
        recovery={[
          {
            muscleId: "m2",
            lastDate: "2026-09-12",
            lastIntensity: 3,
            daysAgo: 4,
          },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: /Back, last hit 4d ago/ })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: /Back, last hit 4d ago/ }));
    expect(screen.getByRole("dialog", { name: "Back" })).toBeInTheDocument();
    expect(screen.getByText("4d · 3 Solid")).toBeInTheDocument();
  });
});
