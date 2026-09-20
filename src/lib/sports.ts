import { isDateKey } from "@/lib/calculations";
import {
  DEFAULT_DISTANCE_UNIT,
  displayPace,
  kmToDisplay,
  metersToDisplay,
  shortDistanceLabel,
  trimNumber,
  type DistanceUnit,
} from "@/lib/units";

export const EFFORT_LEVELS = ["EASY", "MODERATE", "HARD"] as const;
export type EffortLevel = (typeof EFFORT_LEVELS)[number];

export const SPORT_TYPE_IDS = [
  "RUNNING",
  "CYCLING",
  "SWIMMING",
  "WALKING",
  "HIKING",
  "PADEL",
  "TENNIS",
  "FOOTBALL",
] as const;

export type SportTypeId = (typeof SPORT_TYPE_IDS)[number];
export type SportField =
  | "distanceKm"
  | "distanceM"
  | "durationMinutes"
  | "pace"
  | "effort";

export type SportDefinition = {
  id: SportTypeId;
  label: string;
  fields: SportField[];
};

export const SPORTS: SportDefinition[] = [
  { id: "RUNNING", label: "Running", fields: ["distanceKm", "pace"] },
  { id: "CYCLING", label: "Cycling", fields: ["distanceKm", "durationMinutes"] },
  { id: "SWIMMING", label: "Swimming", fields: ["distanceM", "durationMinutes"] },
  { id: "WALKING", label: "Walking", fields: ["distanceKm", "durationMinutes"] },
  { id: "HIKING", label: "Hiking", fields: ["distanceKm", "durationMinutes"] },
  { id: "PADEL", label: "Padel", fields: ["durationMinutes", "effort"] },
  { id: "TENNIS", label: "Tennis", fields: ["durationMinutes", "effort"] },
  { id: "FOOTBALL", label: "Football", fields: ["durationMinutes", "effort"] },
];

export function isSportTypeId(value: unknown): value is SportTypeId {
  return (
    typeof value === "string" &&
    (SPORT_TYPE_IDS as readonly string[]).includes(value)
  );
}

export function sportDefinition(id: string): SportDefinition | null {
  return SPORTS.find((item) => item.id === id) ?? null;
}

export function sportLabel(id: string): string {
  return sportDefinition(id)?.label ?? id;
}

export function effortLabel(effort: string | null | undefined): string {
  if (effort === "EASY") return "Easy";
  if (effort === "MODERATE") return "Moderate";
  if (effort === "HARD") return "Hard";
  return "";
}

export function parsePace(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const mmss = /^(\d{1,2}):([0-5]\d)$/.exec(trimmed);
  if (mmss) return `${Number(mmss[1])}:${mmss[2]}`;
  const decimal = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(decimal) || decimal <= 0 || decimal > 60) return null;
  const minutes = Math.floor(decimal);
  const seconds = Math.round((decimal - minutes) * 60);
  if (seconds === 60) return `${minutes + 1}:00`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export type ParsedSportSession = {
  type: SportTypeId;
  date: string;
  durationMinutes: number | null;
  distanceKm: number | null;
  distanceMeters: number | null;
  pace: string | null;
  effort: EffortLevel | null;
  notes: string | null;
};

function parsePositiveNumber(value: unknown, label: string): number {
  const number = typeof value === "number" ? value : Number(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`${label} is required.`);
  }
  return number;
}

function parsePositiveInt(value: unknown, label: string): number {
  const number = parsePositiveNumber(value, label);
  if (!Number.isInteger(number)) {
    throw new Error(`${label} must be a whole number.`);
  }
  return number;
}

export function parseSportSessionInput(input: {
  type: string;
  date: string;
  durationMinutes?: number | null;
  distanceKm?: number | null;
  distanceMeters?: number | null;
  pace?: string | null;
  effort?: string | null;
  notes?: string | null;
}): ParsedSportSession {
  if (!isSportTypeId(input.type)) throw new Error("Unknown sport.");
  if (!isDateKey(input.date)) throw new Error("Invalid date.");

  const definition = sportDefinition(input.type);
  if (!definition) throw new Error("Unknown sport.");

  const parsed: ParsedSportSession = {
    type: input.type,
    date: input.date,
    durationMinutes: null,
    distanceKm: null,
    distanceMeters: null,
    pace: null,
    effort: null,
    notes: input.notes?.trim() || null,
  };

  if (parsed.notes && parsed.notes.length > 280) {
    throw new Error("Comment must be 280 characters or fewer.");
  }

  for (const field of definition.fields) {
    if (field === "distanceKm") {
      const km = parsePositiveNumber(input.distanceKm, "Distance (km)");
      if (km > 500) throw new Error("Distance looks too high.");
      parsed.distanceKm = Math.round(km * 100) / 100;
    }
    if (field === "distanceM") {
      const meters = parsePositiveNumber(input.distanceMeters, "Distance (m)");
      if (meters > 50000) throw new Error("Distance looks too high.");
      parsed.distanceMeters = Math.round(meters * 10) / 10;
    }
    if (field === "durationMinutes") {
      const minutes = parsePositiveInt(input.durationMinutes, "Time (min)");
      if (minutes > 600) throw new Error("Time looks too long.");
      parsed.durationMinutes = minutes;
    }
    if (field === "pace") {
      const pace = parsePace(String(input.pace ?? ""));
      if (!pace) throw new Error("Pace is required (for example 5:30).");
      parsed.pace = pace;
    }
    if (field === "effort") {
      const effort = String(input.effort ?? "").trim().toUpperCase();
      if (!EFFORT_LEVELS.includes(effort as EffortLevel)) {
        throw new Error("Pick easy, moderate, or hard.");
      }
      parsed.effort = effort as EffortLevel;
    }
  }

  return parsed;
}

function sportSummaryParts(
  session: {
    durationMinutes: number | null;
    distanceKm: number | null;
    distanceMeters: number | null;
    pace: string | null;
    effort: string | null;
  },
  distanceUnit: DistanceUnit,
): string[] {
  const parts: string[] = [];
  if (session.distanceKm != null) {
    parts.push(`${trimNumber(kmToDisplay(session.distanceKm, distanceUnit))} ${distanceUnit}`);
  }
  if (session.distanceMeters != null) {
    parts.push(
      `${trimNumber(metersToDisplay(session.distanceMeters, distanceUnit))} ${shortDistanceLabel(distanceUnit)}`,
    );
  }
  if (session.pace) {
    parts.push(`${displayPace(session.pace, distanceUnit)} /${distanceUnit}`);
  }
  if (session.durationMinutes != null) parts.push(`${session.durationMinutes} min`);
  const effort = effortLabel(session.effort);
  if (effort) parts.push(effort.toLowerCase());
  return parts;
}

export function formatSportSummary(
  session: {
    type: string;
    durationMinutes: number | null;
    distanceKm: number | null;
    distanceMeters: number | null;
    pace: string | null;
    effort: string | null;
  },
  distanceUnit: DistanceUnit = DEFAULT_DISTANCE_UNIT,
): string {
  return sportSummaryParts(session, distanceUnit).join(" · ");
}

export function formatSportGlance(
  session: {
    durationMinutes: number | null;
    distanceKm: number | null;
    distanceMeters: number | null;
    pace: string | null;
    effort: string | null;
  },
  distanceUnit: DistanceUnit = DEFAULT_DISTANCE_UNIT,
): string {
  return sportSummaryParts(session, distanceUnit)[0] ?? "";
}
