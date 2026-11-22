export const SEX_OPTIONS = ["male", "female", "other"] as const;
export type Sex = (typeof SEX_OPTIONS)[number];

export const GOAL_OPTIONS = [
  { key: "general", label: "General fitness" },
  { key: "strength", label: "Strength" },
  { key: "muscle", label: "Build muscle" },
  { key: "fat-loss", label: "Lose fat" },
  { key: "endurance", label: "Endurance" },
] as const;
export type Goal = (typeof GOAL_OPTIONS)[number]["key"];

export const EXPERIENCE_OPTIONS = [
  { key: "beginner", label: "Beginner (< 1 year)" },
  { key: "intermediate", label: "Intermediate (1–3 years)" },
  { key: "advanced", label: "Advanced (3+ years)" },
] as const;
export type Experience = (typeof EXPERIENCE_OPTIONS)[number]["key"];

export const MAX_NOTES_LENGTH = 500;

/** Everything is optional: null means "not provided". */
export type Profile = {
  heightCm: number | null;
  sex: string | null;
  birthYear: number | null;
  goal: string | null;
  experience: string | null;
  profileNotes: string | null;
};

export const EMPTY_PROFILE: Profile = {
  heightCm: null,
  sex: null,
  birthYear: null,
  goal: null,
  experience: null,
  profileNotes: null,
};

export type ProfileInput = {
  heightCm?: string | number | null;
  sex?: string | null;
  birthYear?: string | number | null;
  goal?: string | null;
  experience?: string | null;
  profileNotes?: string | null;
};

function blank(value: unknown): boolean {
  return value == null || (typeof value === "string" && value.trim() === "");
}

function parseInteger(value: unknown, min: number, max: number, label: string):
  | { ok: true; value: number | null }
  | { ok: false; error: string } {
  if (blank(value)) return { ok: true, value: null };
  const num = Number(typeof value === "string" ? value.trim().replace(",", ".") : value);
  if (!Number.isFinite(num) || num < min || num > max) {
    return { ok: false, error: `${label} must be between ${min} and ${max}.` };
  }
  return { ok: true, value: Math.round(num) };
}

function parseChoice(
  value: unknown,
  allowed: readonly string[],
  label: string,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (blank(value)) return { ok: true, value: null };
  if (typeof value === "string" && allowed.includes(value)) {
    return { ok: true, value };
  }
  return { ok: false, error: `Invalid ${label}.` };
}

export function parseProfileInput(
  input: ProfileInput,
  currentYear: number = new Date().getFullYear(),
): { ok: true; value: Profile } | { ok: false; error: string } {
  const height = parseInteger(input.heightCm, 100, 250, "Height (cm)");
  if (!height.ok) return height;
  const birth = parseInteger(input.birthYear, currentYear - 100, currentYear - 10, "Birth year");
  if (!birth.ok) return birth;
  const sex = parseChoice(input.sex, SEX_OPTIONS, "sex");
  if (!sex.ok) return sex;
  const goal = parseChoice(input.goal, GOAL_OPTIONS.map((g) => g.key), "goal");
  if (!goal.ok) return goal;
  const experience = parseChoice(
    input.experience,
    EXPERIENCE_OPTIONS.map((e) => e.key),
    "experience",
  );
  if (!experience.ok) return experience;

  const notes = typeof input.profileNotes === "string" ? input.profileNotes.trim() : "";
  if (notes.length > MAX_NOTES_LENGTH) {
    return { ok: false, error: `Notes are limited to ${MAX_NOTES_LENGTH} characters.` };
  }

  return {
    ok: true,
    value: {
      heightCm: height.value,
      sex: sex.value,
      birthYear: birth.value,
      goal: goal.value,
      experience: experience.value,
      profileNotes: notes || null,
    },
  };
}

function labelFor(
  options: readonly { key: string; label: string }[],
  key: string | null,
): string | null {
  return options.find((option) => option.key === key)?.label ?? null;
}

/** Lines for the AI prompt. Returns [] when the user shared nothing. */
export function profilePromptLines(
  profile: Profile | null | undefined,
  today: string,
  latestWeightKg?: number | null,
): string[] {
  if (!profile) return [];
  const lines: string[] = [];
  if (profile.sex) lines.push(`- Sex: ${profile.sex}`);
  if (profile.birthYear) {
    const year = Number(today.slice(0, 4));
    lines.push(
      `- Age: about ${year - profile.birthYear} (born ${profile.birthYear})`,
    );
  }
  if (profile.heightCm) lines.push(`- Height: ${profile.heightCm} cm`);
  if (latestWeightKg) {
    let weight = `- Latest body weight: ${latestWeightKg} kg`;
    if (profile.heightCm) {
      const bmi = latestWeightKg / (profile.heightCm / 100) ** 2;
      weight += ` (BMI ${bmi.toFixed(1)} — only a rough screen, it ignores muscle mass)`;
    }
    lines.push(weight);
  }
  const goal = labelFor(GOAL_OPTIONS, profile.goal);
  if (goal) lines.push(`- Main goal: ${goal}`);
  const experience = labelFor(EXPERIENCE_OPTIONS, profile.experience);
  if (experience) lines.push(`- Training experience: ${experience}`);
  if (profile.profileNotes) {
    lines.push(`- Own notes (injuries, limits, context): ${profile.profileNotes}`);
  }
  return lines;
}
