import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";

vi.mock("@/app/actions/onboarding", () => ({
  saveOnboardingLocale: vi.fn(),
  completeOnboarding: vi.fn(),
}));

import {
  completeOnboarding,
  saveOnboardingLocale,
} from "@/app/actions/onboarding";

describe("OnboardingTour", () => {
  it("lets a new user pick Catalan, walk through, and finish", async () => {
    const user = userEvent.setup();
    const onLocale = vi.fn();
    const onClose = vi.fn();
    vi.mocked(saveOnboardingLocale).mockResolvedValue({ locale: "ca" });
    vi.mocked(completeOnboarding).mockResolvedValue();

    render(
      <OnboardingTour locale="en" forced onLocale={onLocale} onClose={onClose} />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Language")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Català" }));
    expect(onLocale).toHaveBeenCalledWith("ca");
    expect(saveOnboardingLocale).toHaveBeenCalledWith("ca");
    expect(screen.getByText("Idioma")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Següent" }));
    expect(screen.getByText("Trackr")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Següent" }));
    expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Següent" }));
    expect(screen.getByRole("heading", { name: "Log" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Següent" }));
    expect(screen.getByRole("heading", { name: "Analytics" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Següent" }));
    expect(screen.getByText("Ja està")).toBeInTheDocument();
    expect(screen.getByText(/Pit/)).toBeInTheDocument();
    expect(screen.getByText(/Gatzoneta/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Comença" }));
    await waitFor(() => expect(completeOnboarding).toHaveBeenCalled());
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("can be skipped on first run and closed when replaying", async () => {
    const user = userEvent.setup();
    vi.mocked(saveOnboardingLocale).mockResolvedValue({ locale: "en" });
    vi.mocked(completeOnboarding).mockResolvedValue();

    const first = render(
      <OnboardingTour locale="en" forced onLocale={vi.fn()} onClose={vi.fn()} />,
    );
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await waitFor(() => expect(completeOnboarding).toHaveBeenCalled());
    first.unmount();

    const onClose = vi.fn();
    render(
      <OnboardingTour locale="es" forced={false} onLocale={vi.fn()} onClose={onClose} />,
    );
    expect(screen.getByText("Trackr")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalled();
  });
});
