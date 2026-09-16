import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DayPicker } from "@/components/ui/DayPicker";

describe("DayPicker", () => {
  it("marks the selected chip and can switch to yesterday", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DayPicker today="2026-09-16" date="2026-09-16" onChange={onChange} />,
    );
    expect(screen.getByRole("button", { name: "Today" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Yesterday" }));
    expect(onChange).toHaveBeenCalledWith("2026-09-15");
  });

  it("does not duplicate a formatted date line under Other", async () => {
    const user = userEvent.setup();
    render(
      <DayPicker today="2026-09-16" date="2026-09-16" onChange={() => undefined} />,
    );
    await user.click(screen.getByRole("button", { name: "Other" }));
    expect(screen.getByLabelText("Pick a date")).toBeInTheDocument();
    expect(screen.queryByText(/Sep/i)).not.toBeInTheDocument();
  });
});
