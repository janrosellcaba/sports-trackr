export type RateLimitResult =
  | { ok: true }
  | { ok: false; error: string };

type Bucket = {
  failures: number;
  blockedUntil: number;
};

const buckets = new Map<string, Bucket>();

export const LOGIN_RATE_LIMIT = {
  maxFailures: 8,
  windowMs: 15 * 60 * 1000,
};

export const CONTACT_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
};

type ContactWindow = {
  count: number;
  windowStart: number;
};

const contactWindows = new Map<string, ContactWindow>();

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.blockedUntil > 0 && bucket.blockedUntil <= now && bucket.failures === 0) {
      buckets.delete(key);
    }
  }
}

export function assertNotRateLimited(key: string, now = Date.now()): RateLimitResult {
  prune(now);
  const bucket = buckets.get(key);
  if (!bucket) return { ok: true };
  if (bucket.blockedUntil > now) {
    const minutes = Math.max(1, Math.ceil((bucket.blockedUntil - now) / 60000));
    return {
      ok: false,
      error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }
  return { ok: true };
}

export function recordAuthFailure(key: string, now = Date.now()): RateLimitResult {
  const existing = buckets.get(key) ?? { failures: 0, blockedUntil: 0 };
  const failures = existing.blockedUntil > now ? existing.failures : existing.failures + 1;
  const blockedUntil =
    failures >= LOGIN_RATE_LIMIT.maxFailures ? now + LOGIN_RATE_LIMIT.windowMs : 0;
  buckets.set(key, { failures, blockedUntil });
  if (blockedUntil > now) {
    return assertNotRateLimited(key, now);
  }
  return { ok: true };
}

export function clearAuthFailures(key: string) {
  buckets.delete(key);
}

function pruneContact(now: number) {
  for (const [key, entry] of contactWindows) {
    if (now - entry.windowStart >= CONTACT_RATE_LIMIT.windowMs) {
      contactWindows.delete(key);
    }
  }
}

export function assertContactNotRateLimited(
  key: string,
  now = Date.now(),
): RateLimitResult {
  pruneContact(now);
  const entry = contactWindows.get(key);
  if (!entry || entry.count < CONTACT_RATE_LIMIT.maxAttempts) {
    return { ok: true };
  }
  const minutes = Math.max(
    1,
    Math.ceil((CONTACT_RATE_LIMIT.windowMs - (now - entry.windowStart)) / 60000),
  );
  return {
    ok: false,
    error: `Too many messages. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
  };
}

export function recordContactAttempt(key: string, now = Date.now()) {
  pruneContact(now);
  const existing = contactWindows.get(key);
  if (!existing) {
    contactWindows.set(key, { count: 1, windowStart: now });
    return;
  }
  existing.count += 1;
}

export function resetRateLimitForTests() {
  buckets.clear();
  contactWindows.clear();
}
