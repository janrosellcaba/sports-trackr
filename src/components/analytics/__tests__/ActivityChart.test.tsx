import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActivityChart } from "@/components/analytics/ActivityChart";

vi.mock("@/components/theme/ThemeProvider", () => ({
  useAccentColor: () => "#84cc16",
  useSurfaceColors: () => ({
    ink: "#f4f4f5",
    muted: "#a1a1aa",
    line: "rgba(255,255,255,0.08)",
    paper: "#18181b",
  }),
}));

class ResizeObserverMock {
  private callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: {
            width: 480,
            height: 224,
            top: 0,
            left: 0,
            bottom: 224,
            right: 480,
            x: 0,
            y: 0,
            toJSON() {
              return {};
            },
          },
        } as ResizeObserverEntry,
      ],
      this,
    );
  }
  unobserve() {}
  disconnect() {}
}

describe("ActivityChart", () => {
  it("draws sport columns the full plot height and drops the readout", () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    const { container } = render(
      <ActivityChart
        data={[
          { date: "2026-09-22", gymLoad: 0, workouts: 0, sports: 1, supplements: 0 },
          { date: "2026-09-23", gymLoad: 10, workouts: 1, sports: 0, supplements: 0 },
          { date: "2026-09-24", gymLoad: 3, workouts: 1, sports: 1, supplements: 0 },
        ]}
      />,
    );

    expect(screen.queryByText("Day")).not.toBeInTheDocument();
    expect(screen.queryByText("Yes")).not.toBeInTheDocument();

    const nodes = [...container.querySelectorAll("path")];
    const hatchTops = nodes
      .filter((node) => (node.getAttribute("fill") ?? "").includes("hatch"))
      .map((node) => pathTop(node.getAttribute("d") ?? ""))
      .filter((value): value is number => value != null);
    const gymTops = nodes
      .filter((node) => {
        const fill = node.getAttribute("fill") ?? "";
        return fill.startsWith("url(") && !fill.includes("hatch");
      })
      .map((node) => pathTop(node.getAttribute("d") ?? ""))
      .filter((value): value is number => value != null);

    expect(hatchTops).toHaveLength(2);
    expect(gymTops.length).toBeGreaterThan(0);
    const sportTop = Math.min(...hatchTops);
    const tallestGym = Math.min(...gymTops);
    expect(sportTop).toBeLessThanOrEqual(tallestGym + 1);
    expect(Math.max(...hatchTops) - sportTop).toBeLessThan(1);
  });
});

function pathTop(path: string): number | null {
  const numbers = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const ys = numbers.filter((_, index) => index % 2 === 1);
  if (ys.length === 0) return null;
  return Math.min(...ys);
}
