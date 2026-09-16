export const DEFAULT_MUSCLES = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Abs",
  "Quads",
  "Hamstrings",
  "Abductors",
  "Glutes",
  "Calves",
  "Other",
] as const;

export const INTENSITY_LEVELS = [1, 2, 3, 4, 5] as const;
export type IntensityLevel = (typeof INTENSITY_LEVELS)[number];

const INTENSITY_LABELS: Record<IntensityLevel, string> = {
  1: "Light",
  2: "Easy",
  3: "Solid",
  4: "Hard",
  5: "Wrecked",
};

export function isIntensityLevel(value: unknown): value is IntensityLevel {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

export function intensityLabel(value: number): string {
  if (!isIntensityLevel(value)) return "";
  return INTENSITY_LABELS[value];
}

export function parseIntensity(value: unknown): IntensityLevel {
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!isIntensityLevel(numeric)) {
    throw new Error("Intensity must be a whole number from 1 to 5.");
  }
  return numeric;
}

export function validateMuscleName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Name must be at least 2 characters.";
  if (trimmed.length > 40) return "Name must be 40 characters or fewer.";
  return null;
}

export function parseMuscleName(name: string): string {
  const error = validateMuscleName(name);
  if (error) throw new Error(error);
  return name.trim();
}

export function gymLoad(hits: { intensity: number }[]): number {
  return hits.reduce((sum, hit) => sum + hit.intensity, 0);
}

export function averageIntensity(hits: { intensity: number }[]): number {
  if (hits.length === 0) return 0;
  return Math.round((gymLoad(hits) / hits.length) * 10) / 10;
}

export function formatGymSummary(
  hits: { muscleName: string; intensity: number }[],
  limit = 4,
): string {
  const ordered = [...hits].sort((a, b) => b.intensity - a.intensity);
  if (ordered.length === 0) return "";
  const shown = ordered.slice(0, limit);
  const line = shown.map((hit) => `${hit.muscleName} ${hit.intensity}`).join(" · ");
  const extra = ordered.length - shown.length;
  return extra > 0 ? `${line} +${extra}` : line;
}

export function sameMuscleName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
