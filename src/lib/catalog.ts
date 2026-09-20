import { EXERCISE_CATALOG } from "@/lib/exercises";
import { isDateKey } from "@/lib/calculations";
import { parseMuscleName, sameMuscleName } from "@/lib/muscles";
import { parseOptionalDecimal } from "@/lib/numbers";
import { formatMass, type MassUnit } from "@/lib/units";
import type { CustomExercisePayload } from "@/types/trackr";

export function defaultExerciseSeeds(): Array<{
  name: string;
  muscle: string;
  dualWeights: boolean;
}> {
  return EXERCISE_CATALOG.map((item) => ({
    name: item.name,
    muscle: item.muscle,
    dualWeights: Boolean(item.dualWeights),
  }));
}

export function validateExerciseName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Name must be at least 2 characters.";
  if (trimmed.length > 80) return "Name must be 80 characters or fewer.";
  return null;
}

function parseOptionalWeight(value: number | string | null | undefined, label: string): number | null {
  const numeric = parseOptionalDecimal(value, label);
  if (numeric == null) return null;
  if (numeric < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }
  return numeric;
}

function parseOptionalReps(
  value: number | string | null | undefined,
  label: string,
): number | null {
  if (value == null || String(value).trim() === "") return null;
  const numeric = Number(String(value).replace(",", "."));
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return numeric;
}

export type ParsedCustomExercise = {
  name: string;
  muscleId: string | null;
  workingWeight: number | null;
  workingReps: number | null;
  prWeight: number | null;
  prReps: number | null;
  prDate: string | null;
  dualWeights: boolean;
};

export function parseDualWeightsFlag(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

/** Per-hand weight becomes total load for two-dumbbell lifts. */
export function effectiveWeightKg(
  weight: number | null | undefined,
  dualWeights: boolean,
): number {
  if (weight == null || !Number.isFinite(weight)) return 0;
  return dualWeights ? weight * 2 : weight;
}

export function sumLiftedKg(
  rows: Array<{
    workingWeight?: number | null;
    dualWeights?: boolean;
  }>,
): number {
  return rows.reduce(
    (sum, row) =>
      sum + effectiveWeightKg(row.workingWeight, Boolean(row.dualWeights)),
    0,
  );
}

export function parseCustomExerciseInput(input: {
  name: string;
  muscleId?: string | null;
  workingWeight?: number | string | null;
  workingReps?: number | string | null;
  prWeight?: number | string | null;
  prReps?: number | string | null;
  prDate?: string | null;
  dualWeights?: unknown;
}): ParsedCustomExercise {
  const nameError = validateExerciseName(input.name);
  if (nameError) throw new Error(nameError);

  const muscleId = input.muscleId?.trim() ? input.muscleId.trim() : null;
  const workingWeight = parseOptionalWeight(input.workingWeight, "Working weight");
  const workingReps = parseOptionalReps(input.workingReps, "Working reps");
  const prWeight = parseOptionalWeight(input.prWeight, "PR weight");
  const prReps = parseOptionalReps(input.prReps, "PR reps");

  let prDate = input.prDate?.trim() ? input.prDate.trim() : null;
  if (prDate && !isDateKey(prDate)) {
    throw new Error("PR date must be YYYY-MM-DD.");
  }
  if ((prWeight != null || prReps != null) && !prDate) {
    prDate = null;
  }
  if (prWeight == null && prReps == null) {
    prDate = null;
  }

  return {
    name: input.name.trim(),
    muscleId,
    workingWeight,
    workingReps,
    prWeight,
    prReps,
    prDate,
    dualWeights: parseDualWeightsFlag(input.dualWeights),
  };
}

export type ParsedPersonalRecord = {
  exerciseId: string;
  prWeight: number;
  prReps: number;
  prDate: string | null;
};

export function parsePersonalRecordInput(input: {
  exerciseId?: string | null;
  prWeight?: number | string | null;
  prReps?: number | string | null;
  prDate?: string | null;
}): ParsedPersonalRecord {
  const exerciseId = input.exerciseId?.trim() ?? "";
  if (!exerciseId) throw new Error("Pick an exercise.");

  const prWeight = parseOptionalWeight(input.prWeight, "PR weight");
  const prReps = parseOptionalReps(input.prReps, "PR reps");
  if (prWeight == null) throw new Error("PR weight is required.");
  if (prReps == null) throw new Error("PR reps are required.");

  const prDate = input.prDate?.trim() ? input.prDate.trim() : null;
  if (prDate && !isDateKey(prDate)) {
    throw new Error("PR date must be YYYY-MM-DD.");
  }

  return { exerciseId, prWeight, prReps, prDate };
}

export function isImprovedPersonalRecord(
  previous: { prWeight: number | null; prReps: number | null } | null | undefined,
  next: { prWeight: number | null; prReps: number | null },
): boolean {
  if (next.prWeight == null || next.prReps == null) return false;
  if (previous?.prWeight == null) return true;
  if (next.prWeight > previous.prWeight) return true;
  return (
    next.prWeight === previous.prWeight && next.prReps > (previous.prReps ?? 0)
  );
}

export function formatLift(
  weight: number | null | undefined,
  reps: number | null | undefined,
  massUnit: MassUnit = "kg",
): string {
  if (weight == null && reps == null) return "";
  if (weight == null) return `${reps} reps`;
  const mass = formatMass(weight, massUnit);
  if (reps == null) return mass;
  return `${mass} × ${reps}`;
}

export function muscleNameById(
  muscles: { id: string; name: string }[],
  muscleId: string | null | undefined,
): string | null {
  if (!muscleId) return null;
  return muscles.find((item) => item.id === muscleId)?.name ?? null;
}

export function findMuscleByName(
  muscles: { id: string; name: string }[],
  name: string,
): { id: string; name: string } | undefined {
  return muscles.find((item) => sameMuscleName(item.name, name));
}

export function parseNewMuscleName(
  name: string,
  existing: { name: string }[],
): string {
  const parsed = parseMuscleName(name);
  if (existing.some((item) => sameMuscleName(item.name, parsed))) {
    throw new Error("A muscle with that name already exists.");
  }
  return parsed;
}

export type CatalogExercise = {
  id: string;
  name: string;
  muscleId: string | null;
  muscleName: string | null;
  workingWeight: number | null;
  workingReps: number | null;
  prWeight: number | null;
  prReps: number | null;
  dualWeights: boolean;
};

export function mergeExerciseCatalog(custom: CustomExercisePayload[]): CatalogExercise[] {
  return [...custom]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => ({
      id: item.id,
      name: item.name,
      muscleId: item.muscleId,
      muscleName: item.muscleName,
      workingWeight: item.workingWeight,
      workingReps: item.workingReps,
      prWeight: item.prWeight,
      prReps: item.prReps,
      dualWeights: item.dualWeights,
    }));
}
