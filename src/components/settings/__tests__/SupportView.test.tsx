import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SupportView } from "@/components/settings/SupportView";
import { sendSupportMessage } from "@/app/actions/contact";

vi.mock("@/app/actions/contact", () => ({
  sendSupportMessage: vi.fn(),
}));

describe("SupportView", () => {
  it("sends help, bug, or idea messages through the contact action", async () => {
    const user = userEvent.setup();
    vi.mocked(sendSupportMessage).mockResolvedValue({ ok: true });

    render(<SupportView />);

    await user.type(screen.getByLabelText("Your email"), "you@example.com");
    await user.click(screen.getByRole("radio", { name: "Bug" }));
    await user.type(
      screen.getByLabelText("Message"),
      "Analytics did not load this morning.",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(sendSupportMessage).toHaveBeenCalledWith({
      email: "you@example.com",
      topic: "Bug",
      message: "Analytics did not load this morning.",
    });
    expect(
      await screen.findByRole("status"),
    ).toHaveTextContent("Message sent — thanks for reaching out!");
  });
});
