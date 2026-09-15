import { EXERCISE_CATALOG, type MuscleGroup } from "@/lib/exercises";
import type {
  CustomExercisePayload,
  CustomSupplementPayload,
} from "@/types/trackr";

export const MUSCLE_GROUP_KEYS = [
  "CHEST",
  "BACK",
  "LEGS",
  "SHOULDERS",
  "ARMS",
  "CORE",
  "OTHER",
] as const;

export type MuscleGroupKey = (typeof MUSCLE_GROUP_KEYS)[number];

const BUILTIN_TO_KEY: Record<MuscleGroup, MuscleGroupKey> = {
  Chest: "CHEST",
  Back: "BACK",
  Legs: "LEGS",
  Shoulders: "SHOULDERS",
  Arms: "ARMS",
  Core: "CORE",
  Other: "OTHER",
};

const KEY_TO_LABEL: Record<MuscleGroupKey, string> = {
  CHEST: "Chest",
  BACK: "Back",
  LEGS: "Legs",
  SHOULDERS: "Shoulders",
  ARMS: "Arms",
  CORE: "Core",
  OTHER: "Other",
};

export const SUPPLEMENT_CATALOG = [
  { name: "Whey protein", defaultDose: "1 scoop" },
  { name: "Creatine", defaultDose: "5g" },
  { name: "Pre-workout", defaultDose: "1 scoop" },
] as const;

export function isMuscleGroupKey(value: unknown): value is MuscleGroupKey {
  return (
    typeof value === "string" &&
    (MUSCLE_GROUP_KEYS as readonly string[]).includes(value.toUpperCase())
  );
}

export function normalizeMuscleGroup(value: string): MuscleGroupKey {
  const upper = value.trim().toUpperCase();
  if (isMuscleGroupKey(upper)) return upper;
  const fromLabel = (
    Object.entries(BUILTIN_TO_KEY) as [MuscleGroup, MuscleGroupKey][]
  ).find(([label]) => label.toLowerCase() === value.trim().toLowerCase());
  return fromLabel?.[1] ?? "OTHER";
}

export function muscleGroupLabel(key: MuscleGroupKey | string): string {
  const normalized = normalizeMuscleGroup(String(key));
  return KEY_TO_LABEL[normalized];
}

export type CatalogExercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroupKey;
  source: "builtin" | "custom";
  defaultWeight?: number | null;
  defaultReps?: number | null;
};

export function defaultExerciseSeeds(): Array<{
  name: string;
  muscleGroup: MuscleGroupKey;
}> {
  return EXERCISE_CATALOG.map((item) => ({
    name: item.name,
    muscleGroup: BUILTIN_TO_KEY[item.category],
  }));
}

export function defaultSupplementSeeds(): Array<{
  name: string;
  defaultDose: string;
}> {
  return SUPPLEMENT_CATALOG.map((item) => ({
    name: item.name,
    defaultDose: item.defaultDose,
  }));
}

export function mergeExerciseCatalog(
  custom: CustomExercisePayload[],
): CatalogExercise[] {
  return [...custom]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => ({
      id: item.id,
      name: item.name,
      muscleGroup: normalizeMuscleGroup(item.muscleGroup),
      source: "custom" as const,
      defaultWeight: item.defaultWeight,
      defaultReps: item.defaultReps,
    }));
}

export type CatalogSupplement = {
  id: string;
  name: string;
  source: "builtin" | "custom";
  defaultDose: string;
};

export function mergeSupplementCatalog(
  custom: CustomSupplementPayload[],
): CatalogSupplement[] {
  return [...custom]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => ({
      id: item.id,
      name: item.name,
      source: "custom" as const,
      defaultDose: item.defaultDose,
    }));
}

export function validateExerciseName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Name must be at least 2 characters.";
  if (trimmed.length > 80) return "Name must be 80 characters or fewer.";
  return null;
}

export function validateSupplementName(name: string): string | null {
  return validateExerciseName(name);
}

export function parseDoseHint(dose: string): {
  amountGrams?: number;
  scoops?: number;
} {
  const grams = dose.match(/(\d+(?:\.\d+)?)\s*g/i);
  const scoops = dose.match(/(\d+(?:\.\d+)?)\s*scoop/i);
  return {
    amountGrams: grams ? Number(grams[1]) : undefined,
    scoops: scoops ? Number(scoops[1]) : undefined,
  };
}

export type ParsedCustomExercise = {
  name: string;
  muscleGroup: MuscleGroupKey;
  defaultWeight: number | null;
  defaultReps: number | null;
};

export function parseCustomExerciseInput(input: {
  name: string;
  muscleGroup: string;
  defaultWeight?: number | null;
  defaultReps?: number | null;
}): ParsedCustomExercise {
  const nameError = validateExerciseName(input.name);
  if (nameError) throw new Error(nameError);

  const defaultWeight =
    input.defaultWeight == null || input.defaultWeight === undefined
      ? null
      : Number(input.defaultWeight);
  if (defaultWeight != null && (!Number.isFinite(defaultWeight) || defaultWeight < 0)) {
    throw new Error("Default weight must be a non-negative number.");
  }

  const defaultReps =
    input.defaultReps == null || input.defaultReps === undefined
      ? null
      : Number(input.defaultReps);
  if (
    defaultReps != null &&
    (!Number.isInteger(defaultReps) || defaultReps <= 0)
  ) {
    throw new Error("Default reps must be a positive integer.");
  }

  return {
    name: input.name.trim(),
    muscleGroup: normalizeMuscleGroup(input.muscleGroup),
    defaultWeight,
    defaultReps,
  };
}

export type ParsedCustomSupplement = {
  name: string;
  defaultDose: string;
  iconOrType: string;
};

export function parseCustomSupplementInput(input: {
  name: string;
  defaultDose: string;
  iconOrType?: string;
}): ParsedCustomSupplement {
  const nameError = validateSupplementName(input.name);
  if (nameError) throw new Error(nameError);
  const dose = input.defaultDose.trim();
  if (!dose) throw new Error("Default dose is required.");
  return {
    name: input.name.trim(),
    defaultDose: dose,
    iconOrType: input.iconOrType?.trim() || "pill",
  };
}
