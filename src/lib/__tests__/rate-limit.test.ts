import { afterEach, describe, expect, it } from "vitest";
import {
  CONTACT_RATE_LIMIT,
  LOGIN_RATE_LIMIT,
  assertContactNotRateLimited,
  assertNotRateLimited,
  clearAuthFailures,
  recordAuthFailure,
  recordContactAttempt,
  resetRateLimitForTests,
} from "@/lib/rate-limit";

describe("auth rate limit", () => {
  afterEach(() => {
    resetRateLimitForTests();
  });

  it("blocks after too many failures in the window", () => {
    const key = "127.0.0.1:jan";
    const now = 1_000_000;
    for (let i = 0; i < LOGIN_RATE_LIMIT.maxFailures; i += 1) {
      const result = recordAuthFailure(key, now);
      if (i < LOGIN_RATE_LIMIT.maxFailures - 1) expect(result.ok).toBe(true);
      else expect(result.ok).toBe(false);
    }
    expect(assertNotRateLimited(key, now + 1000).ok).toBe(false);
  });

  it("clears after a successful login", () => {
    const key = "127.0.0.1:jan";
    recordAuthFailure(key, 10);
    clearAuthFailures(key);
    expect(assertNotRateLimited(key, 11).ok).toBe(true);
  });
});

describe("contact rate limit", () => {
  afterEach(() => {
    resetRateLimitForTests();
  });

  it("allows a burst then blocks until the window ends", () => {
    const key = "contact:user-1";
    const now = 1_000_000;
    for (let i = 0; i < CONTACT_RATE_LIMIT.maxAttempts; i += 1) {
      expect(assertContactNotRateLimited(key, now).ok).toBe(true);
      recordContactAttempt(key, now);
    }
    expect(assertContactNotRateLimited(key, now + 1000).ok).toBe(false);
    expect(assertContactNotRateLimited(key, now + CONTACT_RATE_LIMIT.windowMs).ok).toBe(
      true,
    );
  });
});
