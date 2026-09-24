import { isDateKey } from "@/lib/calculations";
import { parseIntensity, parseMuscleName } from "@/lib/muscles";
import { nameKey } from "@/lib/names";
import { MAX_TEXT_FIELD } from "@/lib/constants";
import { parseDualWeightsFlag, validateExerciseName } from "@/lib/catalog";
import {
  EFFORT_LEVELS,
  isSportTypeId,
  parsePace,
  type EffortLevel,
  type SportTypeId,
} from "@/lib/sports";
import { isDistanceUnit, isMassUnit, type DistanceUnit, type MassUnit } from "@/lib/units";
import { parseBodyWeightKg } from "@/lib/weight";
import type { TrackrExportPayload } from "@/lib/export-data";

const MAX_MUSCLES = 80;
const MAX_SESSIONS = 4000;
const MAX_HITS = 20000;
const MAX_SPORTS = 4000;
const MAX_SUPPLEMENTS = 8000;
const MAX_BODY_WEIGHTS = 8000;
const MAX_EXERCISES = 200;
const MAX_SNAPSHOTS = 2000;

export type ImportSnapshot = {
  date: string;
  workingWeight: number | null;
  workingReps: number | null;
  prWeight: number | null;
  prReps: number | null;
};

export type NormalizedImport = {
  preferences: {
    massUnit: MassUnit | null;
    distanceUnit: DistanceUnit | null;
  };
  muscles: Array<{ name: string; sortOrder: number }>;
  gymSessions: Array<{
    date: string;
    notes: string | null;
    hits: Array<{ muscleName: string; intensity: number }>;
  }>;
  sports: Array<{
    date: string;
    type: SportTypeId;
    durationMinutes: number | null;
    distanceKm: number | null;
    distanceMeters: number | null;
    pace: string | null;
    effort: EffortLevel | null;
    notes: string | null;
  }>;
  supplements: Array<{ name: string; dose: string; date: string }>;
  bodyWeights: Array<{ date: string; weightKg: number }>;
  exercises: Array<{
    name: string;
    muscleName: string | null;
    workingWeight: number | null;
    workingReps: number | null;
    prWeight: number | null;
    prReps: number | null;
    prDate: string | null;
    dualWeights?: boolean;
    snapshots: ImportSnapshot[];
  }>;
};

export type ImportParseResult =
  | { ok: true; data: NormalizedImport }
  | { ok: false; error: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function optionalString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function optionalNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(numeric) ? numeric : null;
}

function optionalInt(value: unknown): number | null {
  const numeric = optionalNumber(value);
  if (numeric == null) return null;
  if (!Number.isInteger(numeric)) return null;
  return numeric;
}

function requireDate(value: unknown, label: string): string {
  if (typeof value !== "string" || !isDateKey(value)) {
    throw new Error(`${label} is not a valid date.`);
  }
  return value;
}

function boundedText(value: string, label: string, max = MAX_TEXT_FIELD): string {
  if (value.length > max) {
    throw new Error(`${label} must be ${max} characters or fewer.`);
  }
  return value;
}

export function sportIdentity(item: {
  date: string;
  type: string;
  durationMinutes: number | null;
  distanceKm: number | null;
  distanceMeters: number | null;
  pace: string | null;
  effort: string | null;
  notes: string | null;
}): string {
  return [
    item.date,
    item.type,
    item.durationMinutes ?? "",
    item.distanceKm ?? "",
    item.distanceMeters ?? "",
    item.pace ?? "",
    item.effort ?? "",
    item.notes ?? "",
  ].join("|");
}

export function supplementIdentity(item: {
  name: string;
  dose: string;
  date: string;
}): string {
  return `${item.date}|${nameKey(item.name)}|${item.dose.trim().toLowerCase()}`;
}

export function parseTrackrImport(raw: unknown): ImportParseResult {
  try {
    const root = asRecord(raw);
    if (!root) return { ok: false, error: "Import file must be a Trackr JSON export." };

    const payload = root as TrackrExportPayload;
    const muscles = asArray(payload.muscles).map((row, index) => {
      const item = asRecord(row);
      if (!item) throw new Error(`Muscle ${index + 1} is invalid.`);
      const name = parseMuscleName(String(item.name ?? ""));
      const sortOrder = optionalInt(item.sortOrder) ?? index;
      return { name, sortOrder };
    });
    if (muscles.length > MAX_MUSCLES) {
      throw new Error(`Too many muscles to import (max ${MAX_MUSCLES}).`);
    }

    const gymSessions = asArray(payload.gymSessions).map((row, index) => {
      const item = asRecord(row);
      if (!item) throw new Error(`Gym session ${index + 1} is invalid.`);
      const date = requireDate(item.date, `Gym session ${index + 1}`);
      const notes = optionalString(item.notes);
      if (notes && notes.length > 280) {
        throw new Error(`Gym session ${index + 1} notes are too long.`);
      }
      const hits = asArray(item.hits).map((hitRow, hitIndex) => {
        const hit = asRecord(hitRow);
        if (!hit) throw new Error(`Gym session ${index + 1} hit ${hitIndex + 1} is invalid.`);
        return {
          muscleName: parseMuscleName(String(hit.muscleName ?? "")),
          intensity: parseIntensity(hit.intensity),
        };
      });
      return { date, notes, hits };
    });
    if (gymSessions.length > MAX_SESSIONS) {
      throw new Error(`Too many gym sessions to import (max ${MAX_SESSIONS}).`);
    }
    const hitCount = gymSessions.reduce((sum, session) => sum + session.hits.length, 0);
    if (hitCount > MAX_HITS) {
      throw new Error(`Too many muscle hits to import (max ${MAX_HITS}).`);
    }

    const sports = asArray(payload.sports).map((row, index) => {
      const item = asRecord(row);
      if (!item) throw new Error(`Sport ${index + 1} is invalid.`);
      const type = String(item.type ?? "");
      if (!isSportTypeId(type)) throw new Error(`Sport ${index + 1} has an unknown type.`);
      const date = requireDate(item.date, `Sport ${index + 1}`);
      const notes = optionalString(item.notes);
      if (notes && notes.length > 280) {
        throw new Error(`Sport ${index + 1} notes are too long.`);
      }
      const effortRaw = optionalString(item.effort)?.toUpperCase() ?? null;
      const effort =
        effortRaw && (EFFORT_LEVELS as readonly string[]).includes(effortRaw)
          ? (effortRaw as EffortLevel)
          : null;
      const paceRaw = optionalString(item.pace);
      return {
        date,
        type,
        durationMinutes: optionalInt(item.durationMinutes),
        distanceKm: optionalNumber(item.distanceKm),
        distanceMeters: optionalNumber(item.distanceMeters),
        pace: paceRaw ? parsePace(paceRaw) ?? boundedText(paceRaw, `Sport ${index + 1} pace`) : null,
        effort,
        notes,
      };
    });
    if (sports.length > MAX_SPORTS) {
      throw new Error(`Too many sports to import (max ${MAX_SPORTS}).`);
    }

    const supplements = asArray(payload.supplements).map((row, index) => {
      const item = asRecord(row);
      if (!item) throw new Error(`Supplement ${index + 1} is invalid.`);
      const name = boundedText(String(item.name ?? "").trim(), `Supplement ${index + 1} name`);
      const dose = boundedText(String(item.dose ?? "").trim(), `Supplement ${index + 1} dose`);
      if (!name || !dose) throw new Error(`Supplement ${index + 1} needs a name and dose.`);
      return {
        name,
        dose,
        date: requireDate(item.date, `Supplement ${index + 1}`),
      };
    });
    if (supplements.length > MAX_SUPPLEMENTS) {
      throw new Error(`Too many supplements to import (max ${MAX_SUPPLEMENTS}).`);
    }

    const bodyWeights = asArray(payload.bodyWeights).map((row, index) => {
      const item = asRecord(row);
      if (!item) throw new Error(`Weigh-in ${index + 1} is invalid.`);
      const date = requireDate(item.date, `Weigh-in ${index + 1}`);
      let weightKg: number;
      try {
        weightKg = parseBodyWeightKg(item.weightKg as number | string | null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid weight.";
        throw new Error(`Weigh-in ${index + 1}: ${message}`);
      }
      return { date, weightKg };
    });
    if (bodyWeights.length > MAX_BODY_WEIGHTS) {
      throw new Error(`Too many weigh-ins to import (max ${MAX_BODY_WEIGHTS}).`);
    }

    const exercises = asArray(payload.customExercises).map((row, index) => {
      const item = asRecord(row);
      if (!item) throw new Error(`Exercise ${index + 1} is invalid.`);
      const nameError = validateExerciseName(String(item.name ?? ""));
      if (nameError) throw new Error(`Exercise ${index + 1}: ${nameError}`);
      const name = String(item.name).trim();
      const muscleName = optionalString(item.muscleName);
      if (muscleName) parseMuscleName(muscleName);
      const prDate = optionalString(item.prDate);
      if (prDate && !isDateKey(prDate)) {
        throw new Error(`Exercise ${index + 1} has an invalid PR date.`);
      }
      const snapshots = asArray(item.snapshots).map((snapRow, snapIndex) => {
        const snap = asRecord(snapRow);
        if (!snap) throw new Error(`Exercise ${index + 1} snapshot ${snapIndex + 1} is invalid.`);
        return {
          date: requireDate(snap.date, `Exercise ${index + 1} snapshot ${snapIndex + 1}`),
          workingWeight: optionalNumber(snap.workingWeight),
          workingReps: optionalInt(snap.workingReps),
          prWeight: optionalNumber(snap.prWeight),
          prReps: optionalInt(snap.prReps),
        };
      });
      return {
        name,
        muscleName,
        workingWeight: optionalNumber(item.workingWeight),
        workingReps: optionalInt(item.workingReps),
        prWeight: optionalNumber(item.prWeight),
        prReps: optionalInt(item.prReps),
        prDate: prDate && isDateKey(prDate) ? prDate : null,
        dualWeights:
          item.dualWeights === undefined ? undefined : parseDualWeightsFlag(item.dualWeights),
        snapshots,
      };
    });
    if (exercises.length > MAX_EXERCISES) {
      throw new Error(`Too many exercises to import (max ${MAX_EXERCISES}).`);
    }
    const snapshotCount = exercises.reduce((sum, item) => sum + item.snapshots.length, 0);
    if (snapshotCount > MAX_SNAPSHOTS) {
      throw new Error(`Too many exercise snapshots to import (max ${MAX_SNAPSHOTS}).`);
    }

    const prefs = asRecord(payload.preferences);
    const massUnit = prefs && isMassUnit(prefs.massUnit) ? prefs.massUnit : null;
    const distanceUnit =
      prefs && isDistanceUnit(prefs.distanceUnit) ? prefs.distanceUnit : null;

    const empty =
      muscles.length === 0 &&
      gymSessions.length === 0 &&
      sports.length === 0 &&
      supplements.length === 0 &&
      bodyWeights.length === 0 &&
      exercises.length === 0 &&
      massUnit == null &&
      distanceUnit == null;
    if (empty) return { ok: false, error: "Nothing to import in that file." };

    return {
      ok: true,
      data: {
        preferences: { massUnit, distanceUnit },
        muscles,
        gymSessions,
        sports,
        supplements,
        bodyWeights,
        exercises,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not read that import file.",
    };
  }
}
