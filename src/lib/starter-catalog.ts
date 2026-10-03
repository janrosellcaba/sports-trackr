import { parseAppLocale, type AppLocale } from "@/lib/locale";

export const STARTER_MUSCLE_KEYS = [
  "chest",
  "shoulders",
  "triceps",
  "back",
  "biceps",
  "core",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
] as const;

export type StarterMuscleKey = (typeof STARTER_MUSCLE_KEYS)[number];

export const STARTER_EXERCISE_KEYS = [
  "benchPress",
  "overheadPress",
  "pullUp",
  "squat",
  "deadlift",
  "bicepCurl",
  "plank",
] as const;

export type StarterExerciseKey = (typeof STARTER_EXERCISE_KEYS)[number];

const MUSCLE_NAMES: Record<AppLocale, Record<StarterMuscleKey, string>> = {
  en: {
    chest: "Chest",
    shoulders: "Shoulders",
    triceps: "Triceps",
    back: "Back",
    biceps: "Biceps",
    core: "Core",
    quads: "Quads",
    hamstrings: "Hamstrings",
    glutes: "Glutes",
    calves: "Calves",
  },
  es: {
    chest: "Pecho",
    shoulders: "Hombros",
    triceps: "Tríceps",
    back: "Espalda",
    biceps: "Bíceps",
    core: "Core",
    quads: "Cuádriceps",
    hamstrings: "Isquiotibiales",
    glutes: "Glúteos",
    calves: "Gemelos",
  },
  ca: {
    chest: "Pit",
    shoulders: "Espatlles",
    triceps: "Tríceps",
    back: "Esquena",
    biceps: "Bíceps",
    core: "Core",
    quads: "Quàdriceps",
    hamstrings: "Isquiotibials",
    glutes: "Glutis",
    calves: "Bessons",
  },
};

const EXERCISE_NAMES: Record<AppLocale, Record<StarterExerciseKey, string>> = {
  en: {
    benchPress: "Bench Press",
    overheadPress: "Overhead Press",
    pullUp: "Pull-Up",
    squat: "Squat",
    deadlift: "Deadlift",
    bicepCurl: "Bicep Curl",
    plank: "Plank",
  },
  es: {
    benchPress: "Press banca",
    overheadPress: "Press militar",
    pullUp: "Dominada",
    squat: "Sentadilla",
    deadlift: "Peso muerto",
    bicepCurl: "Curl de bíceps",
    plank: "Plancha",
  },
  ca: {
    benchPress: "Press de banca",
    overheadPress: "Press militar",
    pullUp: "Dominada",
    squat: "Gatzoneta",
    deadlift: "Pes mort",
    bicepCurl: "Curl de bíceps",
    plank: "Planxa",
  },
};

const EXERCISE_MUSCLE: Record<StarterExerciseKey, StarterMuscleKey> = {
  benchPress: "chest",
  overheadPress: "shoulders",
  pullUp: "back",
  squat: "quads",
  deadlift: "back",
  bicepCurl: "biceps",
  plank: "core",
};

export function starterMuscles(locale: unknown): Array<{
  key: StarterMuscleKey;
  name: string;
}> {
  const lang = parseAppLocale(locale);
  return STARTER_MUSCLE_KEYS.map((key) => ({
    key,
    name: MUSCLE_NAMES[lang][key],
  }));
}

export function starterExercises(locale: unknown): Array<{
  key: StarterExerciseKey;
  name: string;
  muscleKey: StarterMuscleKey;
  muscle: string;
  dualWeights: boolean;
}> {
  const lang = parseAppLocale(locale);
  return STARTER_EXERCISE_KEYS.map((key) => {
    const muscleKey = EXERCISE_MUSCLE[key];
    return {
      key,
      name: EXERCISE_NAMES[lang][key],
      muscleKey,
      muscle: MUSCLE_NAMES[lang][muscleKey],
      dualWeights: false,
    };
  });
}

export const DEFAULT_MUSCLES = STARTER_MUSCLE_KEYS.map(
  (key) => MUSCLE_NAMES.en[key],
);
