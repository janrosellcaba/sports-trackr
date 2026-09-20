import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsView } from "@/components/settings/SettingsView";
import type { AuthUser } from "@/lib/auth";

vi.mock("@/app/actions/auth", () => ({ logout: vi.fn() }));
vi.mock("@/app/actions/account", () => ({ deleteAccount: vi.fn() }));
vi.mock("@/app/actions/analytics", () => ({ exportMyData: vi.fn() }));
vi.mock("@/app/actions/import", () => ({ importMyData: vi.fn() }));
vi.mock("@/app/actions/contact", () => ({ sendSupportMessage: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const user: AuthUser = {
  id: "u1",
  username: "alex",
  role: "USER",
  accentTheme: "volt",
  colorMode: "dark",
  massUnit: "kg",
  distanceUnit: "km",
};

describe("SettingsView", () => {
  it("puts Contact support and Log out on the main settings screen", () => {
    render(
      <SettingsView
        user={user}
        section="menu"
        muscles={[]}
        customExercises={[]}
      />,
    );

    expect(screen.getByRole("link", { name: /Contact support/ })).toHaveAttribute(
      "href",
      "/settings/support",
    );
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });
});
