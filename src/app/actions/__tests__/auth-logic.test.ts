import { describe, expect, it } from "vitest";
import {
  confirmsUsername,
  isAdminUser,
  isValidInviteCode,
  isValidUsername,
  normalizeUsername,
  validatePassword,
} from "@/lib/auth-logic";

describe("normalizeUsername", () => {
  it("trims and lowercases usernames", () => {
    expect(normalizeUsername("  Jan  ")).toBe("jan");
    expect(normalizeUsername("ALEX")).toBe("alex");
  });
});

describe("isValidUsername", () => {
  it("accepts 2–32 lowercase letters, numbers, dots, underscores, and hyphens", () => {
    expect(isValidUsername("ab")).toBe(true);
    expect(isValidUsername("jan.rosell_1-2")).toBe(true);
  });

  it("rejects short, long, and illegal characters", () => {
    expect(isValidUsername("a")).toBe(false);
    expect(isValidUsername("A".repeat(33).toLowerCase() + "x")).toBe(false);
    expect(isValidUsername("Jan")).toBe(false);
    expect(isValidUsername("has space")).toBe(false);
  });
});

describe("isValidInviteCode", () => {
  it("accepts the expected registration code", () => {
    expect(isValidInviteCode("01234", "01234")).toBe(true);
    expect(isValidInviteCode(" 01234 ", "01234")).toBe(true);
  });

  it("rejects invalid registration codes of the same length without early exit", () => {
    expect(isValidInviteCode("wrong", "01234")).toBe(false);
    expect(isValidInviteCode("01235", "01234")).toBe(false);
    expect(isValidInviteCode("", "01234")).toBe(false);
  });
});

describe("validatePassword", () => {
  it("enforces length bounds", () => {
    expect(validatePassword("short", 72)).toBe("Password must be at least 8 characters.");
    expect(validatePassword("testpass1", 72)).toBeNull();
    expect(validatePassword("x".repeat(73), 72)).toBe(
      "Password must be 72 characters or fewer.",
    );
  });
});

describe("isAdminUser", () => {
  it("treats only username jan as admin", () => {
    expect(isAdminUser("jan")).toBe(true);
    expect(isAdminUser(" JAN ")).toBe(true);
    expect(isAdminUser("test")).toBe(false);
  });
});

describe("confirmsUsername", () => {
  it("matches the typed username, ignoring case and padding", () => {
    expect(confirmsUsername("jan", "JAN")).toBe(true);
    expect(confirmsUsername("jan", "  jan  ")).toBe(true);
    expect(confirmsUsername("jan", "janet")).toBe(false);
  });
});
