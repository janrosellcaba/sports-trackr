import { describe, expect, it } from "vitest";
import {
  assignRole,
  isValidInviteCode,
  normalizeUsername,
} from "@/lib/auth-logic";

describe("normalizeUsername", () => {
  it("trims and lowercases usernames", () => {
    expect(normalizeUsername("  Jan  ")).toBe("jan");
    expect(normalizeUsername("ALEX")).toBe("alex");
  });
});

describe("assignRole", () => {
  it("assigns ADMIN only to username jan", () => {
    expect(assignRole("jan")).toBe("ADMIN");
  });

  it("assigns USER to everyone else", () => {
    expect(assignRole("janet")).toBe("USER");
    expect(assignRole("alex")).toBe("USER");
  });
});

describe("isValidInviteCode", () => {
  it("accepts the expected registration code", () => {
    expect(isValidInviteCode("01234", "01234")).toBe(true);
    expect(isValidInviteCode(" 01234 ", "01234")).toBe(true);
  });

  it("rejects invalid registration codes", () => {
    expect(isValidInviteCode("wrong", "01234")).toBe(false);
    expect(isValidInviteCode("", "01234")).toBe(false);
  });
});
