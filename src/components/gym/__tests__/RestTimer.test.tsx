import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RestTimerProvider, useRestTimer } from "@/components/gym/RestTimer";

function StartControl() {
  const timer = useRestTimer();
  return (
    <button type="button" onClick={() => timer?.start(5)}>
      Start rest
    </button>
  );
}

describe("RestTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("decrements the countdown and exposes skip / adjust controls", () => {
    render(
      <RestTimerProvider>
        <StartControl />
      </RestTimerProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Start rest" }));
    expect(screen.getByRole("timer")).toHaveTextContent("0:05");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("0:04");

    fireEvent.click(screen.getByRole("button", { name: "Add 30 seconds" }));
    expect(screen.getByRole("timer")).toHaveTextContent("0:34");

    fireEvent.click(screen.getByRole("button", { name: "Subtract 30 seconds" }));
    expect(screen.getByRole("timer")).toHaveTextContent("0:04");

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  });
});
