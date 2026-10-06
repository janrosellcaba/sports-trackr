import { addDaysISO, isDateKey } from "@/lib/calculations";
import { intensityLabel } from "@/lib/muscles";
import { effortLabel, sportLabel } from "@/lib/sports";
import type {
  BodyWeightPayload,
  GymSessionPayload,
  SportSessionPayload,
  SupplementPayload,
} from "@/types/trackr";

export const TRAINER_LOG_RANGES = ["sessions-30", "days-30", "days-60"] as const;
export type TrainerLogRange = (typeof TRAINER_LOG_RANGES)[number];

const RANGE_LABEL: Record<TrainerLogRange, string> = {
  "sessions-30": "last 30 sessions",
  "days-30": "last 30 days",
  "days-60": "last 60 days",
};

const INTENSITY_KEY = "1 Light, 2 Steady, 3 Solid, 4 Hard, 5 Wrecked";

const ABOUT =
  "A session is a day with gym or sport. Rest days inside the span are included when they have supplements or a weigh-in. weightKg is only present on days it was logged. latestWeight is the newest weigh-in on or before today, even when it is older than this range. Pace is minutes per km.";

export type TrainerLogMuscle = {
  name: string;
  intensity: number;
  level?: string;
};

export type TrainerLogSport = {
  sport: string;
  durationMinutes?: number;
  distanceKm?: number;
  distanceMeters?: number;
  paceMinPerKm?: string;
  effort?: string;
  notes?: string;
};

export type TrainerLogDay = {
  date: string;
  weightKg?: number;
  gym?: {
    muscles: TrainerLogMuscle[];
    notes?: string;
  };
  sports?: TrainerLogSport[];
  supplements?: Array<{ name: string; dose: string }>;
};

export type TrainerLog = {
  range: string;
  from: string | null;
  to: string;
  trainingDays: number;
  intensity: string;
  about: string;
  latestWeight?: { date: string; weightKg: number };
  days: TrainerLogDay[];
};

type DayAcc = {
  date: string;
  gym: GymSessionPayload | null;
  sports: SportSessionPayload[];
  supplements: SupplementPayload[];
  weightKg: number | null;
};

function isTrainingDay(day: DayAcc): boolean {
  return day.gym != null || day.sports.length > 0;
}

function hasContent(day: DayAcc): boolean {
  return (
    isTrainingDay(day) || day.supplements.length > 0 || day.weightKg != null
  );
}

function dayPayload(day: DayAcc): TrainerLogDay {
  const payload: TrainerLogDay = { date: day.date };
  if (day.weightKg != null) payload.weightKg = day.weightKg;
  if (day.gym) {
    const notes = day.gym.notes?.trim();
    payload.gym = {
      muscles: [...day.gym.hits]
        .sort(
          (a, b) =>
            b.intensity - a.intensity || a.muscleName.localeCompare(b.muscleName),
        )
        .map((hit) => {
          const level = intensityLabel(hit.intensity);
          return {
            name: hit.muscleName,
            intensity: hit.intensity,
            ...(level ? { level } : {}),
          };
        }),
      ...(notes ? { notes } : {}),
    };
  }
  if (day.sports.length > 0) {
    payload.sports = day.sports.map((session) => {
      const effort = effortLabel(session.effort);
      const notes = session.notes?.trim();
      return {
        sport: sportLabel(session.type),
        ...(session.durationMinutes != null
          ? { durationMinutes: session.durationMinutes }
          : {}),
        ...(session.distanceKm != null ? { distanceKm: session.distanceKm } : {}),
        ...(session.distanceMeters != null
          ? { distanceMeters: session.distanceMeters }
          : {}),
        ...(session.pace ? { paceMinPerKm: session.pace } : {}),
        ...(effort ? { effort } : {}),
        ...(notes ? { notes } : {}),
      };
    });
  }
  if (day.supplements.length > 0) {
    payload.supplements = [...day.supplements]
      .sort((a, b) => a.name.localeCompare(b.name) || a.dose.localeCompare(b.dose))
      .map((item) => ({ name: item.name, dose: item.dose }));
  }
  return payload;
}

export function buildTrainerLog(
  input: {
    today: string;
    gymSessions: GymSessionPayload[];
    sports: SportSessionPayload[];
    supplements: SupplementPayload[];
    bodyWeights: BodyWeightPayload[];
  },
  range: TrainerLogRange,
): TrainerLog {
  const today = isDateKey(input.today) ? input.today : "";
  const days = new Map<string, DayAcc>();

  function bucket(date: string): DayAcc | null {
    if (!today || !isDateKey(date) || date > today) return null;
    const existing = days.get(date);
    if (existing) return existing;
    const created: DayAcc = {
      date,
      gym: null,
      sports: [],
      supplements: [],
      weightKg: null,
    };
    days.set(date, created);
    return created;
  }

  for (const session of input.gymSessions) {
    const day = bucket(session.date);
    if (day) day.gym = session;
  }
  for (const session of input.sports) {
    bucket(session.date)?.sports.push(session);
  }
  for (const intake of input.supplements) {
    bucket(intake.date)?.supplements.push(intake);
  }
  for (const entry of input.bodyWeights) {
    const day = bucket(entry.date);
    if (day) day.weightKg = entry.weightKg;
  }

  const latest = input.bodyWeights
    .filter((entry) => isDateKey(entry.date) && (!today || entry.date <= today))
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  const trainingDates = [...days.values()]
    .filter(isTrainingDay)
    .map((day) => day.date)
    .sort((a, b) => b.localeCompare(a));

  let from: string | null = null;
  if (range === "sessions-30") {
    const selected = trainingDates.slice(0, 30);
    from = selected[selected.length - 1] ?? null;
  } else if (today) {
    from = addDaysISO(today, range === "days-30" ? -29 : -59);
  }

  const included = [...days.values()]
    .filter((day) => from != null && day.date >= from && day.date <= today && hasContent(day))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    range: RANGE_LABEL[range],
    from,
    to: today,
    trainingDays: included.filter(isTrainingDay).length,
    intensity: INTENSITY_KEY,
    about: ABOUT,
    ...(latest ? { latestWeight: { date: latest.date, weightKg: latest.weightKg } } : {}),
    days: included.map(dayPayload),
  };
}
