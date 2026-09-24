export type MusclePayload = {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
};

export type MuscleRecoveryPayload = {
  muscleId: string;
  lastDate: string;
  lastIntensity: number;
  daysAgo: number;
};

export type MuscleHitPayload = {
  id: string;
  muscleId: string;
  muscleName: string;
  intensity: number;
};

export type GymSessionPayload = {
  id: string;
  date: string;
  notes: string | null;
  hits: MuscleHitPayload[];
  hitCount: number;
  totalLoad: number;
};

export type SupplementPayload = {
  id: string;
  name: string;
  dose: string;
  date: string;
};

export type BodyWeightPayload = {
  id: string;
  date: string;
  weightKg: number;
};

export type SportSessionPayload = {
  id: string;
  date: string;
  type: string;
  durationMinutes: number | null;
  distanceKm: number | null;
  distanceMeters: number | null;
  pace: string | null;
  effort: string | null;
  notes: string | null;
};

export type CustomExercisePayload = {
  id: string;
  name: string;
  muscleId: string | null;
  muscleName: string | null;
  workingWeight: number | null;
  workingReps: number | null;
  prWeight: number | null;
  prReps: number | null;
  prDate: string | null;
  dualWeights: boolean;
  createdAt: string;
};

export type { AnalyticsPeriod } from "@/lib/analytics";

export type NotebookExercise = {
  id: string;
  name: string;
  prWeight: number | null;
  prReps: number | null;
  prDate: string | null;
  dualWeights: boolean;
};

export type WeightPoint = {
  date: string;
  weightKg: number;
};

export type DailyActivityPoint = {
  date: string;
  gymLoad: number;
  workouts: number;
  sports: number;
  supplements: number;
};

export type TopMuscle = {
  name: string;
  load: number;
  hits: number;
  days: number;
  avgIntensity: number;
};

export type AnalyticsSummary = {
  days: number;
  periodLabel: string;
  activityDays: number;
  gymDays: number;
  sportDays: number;
  totalWorkouts: number;
  totalHits: number;
  totalGymLoad: number;
  totalSports: number;
  totalSportMinutes: number;
  totalSportKm: number;
  supplementDays: number;
  supplementStreak: number;
  gymStreak: number;
  sportStreak: number;
  restDays: number;
  chartLabel: string;
  previous: {
    activityDays: number;
    gymLoad: number;
  } | null;
  trends: {
    activity: number | null;
    workouts: number | null;
    gymLoad: number | null;
    sports: number | null;
    supplements: number | null;
  };
  daily: DailyActivityPoint[];
  topMuscles: TopMuscle[];
  weights: WeightPoint[];
};

export type ProgressionPoint = {
  date: string;
  prWeight: number | null;
  prReps: number | null;
  estimatedOneRm: number | null;
  dualWeights: boolean;
};
