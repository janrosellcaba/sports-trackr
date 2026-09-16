export type MusclePayload = {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
};

export type MuscleHitPayload = {
  id: string;
  muscleId: string | null;
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
  createdAt: string;
};

export type CustomSupplementPayload = {
  id: string;
  name: string;
  defaultDose: string;
  iconOrType: string;
  createdAt: string;
};

export type AnalyticsPeriod = 7 | 30 | 90 | 0;

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
  trends: {
    workouts: number;
    gymLoad: number;
    sports: number;
    supplements: number;
  };
  daily: DailyActivityPoint[];
  topMuscles: TopMuscle[];
};

export type ProgressionPoint = {
  date: string;
  workingWeight: number | null;
  prWeight: number | null;
  estimatedOneRm: number | null;
};

export type AppTab = "home" | "log" | "analytics" | "settings";

export type AppState = {
  today: string;
  todayGym: GymSessionPayload | null;
  todaySports: SportSessionPayload[];
  todaySupplements: SupplementPayload[];
  gymSessions: GymSessionPayload[];
  sports: SportSessionPayload[];
  supplements: SupplementPayload[];
  muscles: MusclePayload[];
  customExercises: CustomExercisePayload[];
  customSupplements: CustomSupplementPayload[];
};
