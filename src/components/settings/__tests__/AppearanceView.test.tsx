import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppearanceView } from "@/components/settings/AppearanceView";

vi.mock("@/components/theme/ThemeProvider", () => ({
  useAccentTheme: () => ({
    theme: {
      id: "volt",
      name: "Volt Nitro",
      primary: "#84cc16",
      glow: "rgba(132, 204, 22, 0.38)",
    },
    setTheme: vi.fn(),
    colorMode: "dark",
    setColorMode: vi.fn(),
    saveError: null,
  }),
}));

describe("AppearanceView", () => {
  it("only offers mode and accent, not weight or distance units", () => {
    render(<AppearanceView />);

    expect(screen.getByRole("group", { name: "Color mode" })).toBeInTheDocument();
    expect(screen.getByRole("listbox", { name: "Accent" })).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Weight unit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Distance unit" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Kilograms")).not.toBeInTheDocument();
    expect(screen.queryByText("Pounds")).not.toBeInTheDocument();
    expect(screen.queryByText("Miles")).not.toBeInTheDocument();
  });
});
