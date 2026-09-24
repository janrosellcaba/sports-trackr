import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BodyWeightBar } from "@/components/weight/BodyWeightBar";

vi.mock("@/app/actions/weight", () => ({
  saveBodyWeight: vi.fn(),
  deleteBodyWeight: vi.fn(),
}));

import { deleteBodyWeight, saveBodyWeight } from "@/app/actions/weight";

describe("BodyWeightBar", () => {
  it("saves a weigh-in for the selected day", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    vi.mocked(saveBodyWeight).mockResolvedValue({
      id: "w1",
      date: "2026-09-24",
      weightKg: 82.4,
    });

    render(
      <BodyWeightBar
        date="2026-09-24"
        entry={null}
        onChange={onChange}
        onRemoved={vi.fn()}
      />,
    );

    expect(screen.getByText("None for this day.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Log weight" }));
    await user.type(screen.getByRole("textbox", { name: "Body weight" }), "82.4");
    await user.click(screen.getByRole("button", { name: "Save weight" }));

    expect(saveBodyWeight).toHaveBeenCalledWith({ date: "2026-09-24", weightKg: 82.4 });
    expect(onChange).toHaveBeenCalledWith({
      id: "w1",
      date: "2026-09-24",
      weightKg: 82.4,
    });
  });

  it("clears the weigh-in for the selected day", async () => {
    const user = userEvent.setup();
    const onRemoved = vi.fn();
    vi.mocked(deleteBodyWeight).mockResolvedValue();

    render(
      <BodyWeightBar
        date="2026-09-24"
        entry={{ id: "w1", date: "2026-09-24", weightKg: 82.4 }}
        onChange={vi.fn()}
        onRemoved={onRemoved}
      />,
    );

    expect(screen.getByText("82.4kg")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(deleteBodyWeight).toHaveBeenCalledWith("w1");
    expect(onRemoved).toHaveBeenCalled();
  });
});
