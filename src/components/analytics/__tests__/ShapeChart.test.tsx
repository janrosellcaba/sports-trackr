import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ShapeChart } from "@/components/analytics/ShapeChart";

vi.mock("@/components/theme/ThemeProvider", () => ({
  useAccentColor: () => "#84cc16",
  useSurfaceColors: () => ({
    ink: "#f4f4f5",
    muted: "#a1a1aa",
    line: "rgba(255,255,255,0.08)",
    paper: "#18181b",
  }),
}));

describe("ShapeChart", () => {
  it("shows the latest score and how it moved this week", () => {
    render(
      <ShapeChart
        points={[
          { date: "2026-09-17", score: 40.2 },
          { date: "2026-09-24", score: 28.4 },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Shape" })).toBeInTheDocument();
    expect(screen.getByText("All time")).toBeInTheDocument();
    expect(screen.getAllByText("28")).toHaveLength(2);
    expect(screen.getByText("−12 this week")).toBeInTheDocument();
  });

  it("explains an empty history", () => {
    render(<ShapeChart points={[]} />);
    expect(screen.getByText("Log gym or sport to see your shape.")).toBeInTheDocument();
  });
});
