export const STALE_SESSION_HOURS = 3;

export type SessionTimesInput = {
  startTime: string | Date;
  endTime?: string | Date | null;
};

export type SessionTimesResult = {
  start: Date;
  end: Date | null;
  durationMinutes: number;
  error?: string;
};

function toDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseSessionTimes(
  input: SessionTimesInput,
): SessionTimesResult {
  const start = toDate(input.startTime);
  if (!start) {
    return {
      start: new Date(0),
      end: null,
      durationMinutes: 0,
      error: "Start time is required.",
    };
  }

  const end = toDate(input.endTime ?? null);
  if (input.endTime != null && input.endTime !== "" && !end) {
    return {
      start,
      end: null,
      durationMinutes: 0,
      error: "End time is invalid.",
    };
  }

  if (end && end.getTime() < start.getTime()) {
    return {
      start,
      end,
      durationMinutes: 0,
      error: "End time must be after start time.",
    };
  }

  const durationMinutes = end
    ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
    : 0;

  return { start, end, durationMinutes };
}

export function isStaleOpenSession(
  startTime: string | Date,
  now = new Date(),
  hours = STALE_SESSION_HOURS,
): boolean {
  const start = toDate(startTime);
  if (!start) return false;
  return now.getTime() - start.getTime() >= hours * 60 * 60 * 1000;
}

export function toDatetimeLocalValue(value: string | Date, now = new Date()): string {
  const date = toDate(value) ?? now;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function datetimeLocalToIso(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid datetime.");
  }
  return parsed.toISOString();
}

export function tryDatetimeLocal(value: string): Date | null {
  return toDate(value);
}
