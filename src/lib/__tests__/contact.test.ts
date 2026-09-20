import { describe, expect, it } from "vitest";
import {
  buildSupportEmail,
  escapeHtml,
  parseSupportInput,
} from "@/lib/contact";

describe("parseSupportInput", () => {
  it("accepts a complete help message", () => {
    expect(
      parseSupportInput({
        email: "  you@example.com ",
        topic: "Help",
        message: "  How do I add a PR?  ",
      }),
    ).toEqual({
      ok: true,
      email: "you@example.com",
      topic: "Help",
      message: "How do I add a PR?",
    });
  });

  it("rejects missing fields, bad emails, and unknown topics", () => {
    expect(parseSupportInput({ email: "", topic: "Help", message: "Hi" })).toEqual({
      ok: false,
      error: "Please fill in your email and message.",
    });
    expect(
      parseSupportInput({ email: "not-an-email", topic: "Bug", message: "Broken" }),
    ).toEqual({
      ok: false,
      error: "Please enter a valid email address.",
    });
    expect(
      parseSupportInput({ email: "you@example.com", topic: "Other", message: "Hi" }),
    ).toEqual({
      ok: false,
      error: "Please choose a valid topic.",
    });
  });
});

describe("buildSupportEmail", () => {
  it("escapes HTML in the username, email, and body", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
    const email = buildSupportEmail({
      username: `<jan>`,
      email: `a@b.com`,
      topic: "Bug",
      message: "Line 1\n<script>",
    });
    expect(email.subject).toBe("[Trackr] Bug from <jan>");
    expect(email.html).toContain("&lt;jan&gt;");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).not.toContain("<script>");
  });
});
