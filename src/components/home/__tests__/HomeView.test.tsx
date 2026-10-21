import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HomeView } from "@/components/home/HomeView";
import type { GymSessionPayload } from "@/types/trackr";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const gym: GymSessionPayload = {
  id: "gym",
  date: "2026-10-21",
  notes: null,
  hitCount: 1,
  totalLoad: 4,
  hits: [{ id: "hit", muscleId: "chest", muscleName: "Chest", intensity: 4 }],
};

describe("HomeView", () => {
  it("shows shape and the week, and folds a logged section", async () => {
    const user = userEvent.setup();
    render(
      <HomeView
        today="2026-10-21"
        date="2026-10-21"
        gym={gym}
        sports={[]}
        weight={null}
        supplements={[]}
        recovery={[]}
        muscles={[
          {
            id: "chest",
            name: "Chest",
            sortOrder: 0,
            createdAt: "2026-10-21T00:00:00.000Z",
          },
        ]}
        customExercises={[]}
        sportCatalog={[
          {
            id: "running",
            name: "Running",
            nameKey: "RUNNING",
            fields: ["distanceKm", "pace"],
            sortOrder: 0,
          },
        ]}
        shape={{ score: 42, weekChange: 3 }}
        week={[
          { date: "2026-10-19", kind: "rest" },
          { date: "2026-10-20", kind: "gym" },
          { date: "2026-10-21", kind: "sport" },
        ]}
      />,
    );

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("+3 this week")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Wed 21, sport" })).toHaveAttribute(
      "aria-current",
      "date",
    );
    expect(screen.getByRole("button", { name: /Gym/ })).toHaveTextContent("Chest 4");
    expect(screen.queryByRole("button", { name: /Chest, 4/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Running" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Gym/ }));
    expect(screen.getByRole("button", { name: /Chest, 4/ })).toBeInTheDocument();
  });
});
