export type SetPayload = {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
};

export type ExercisePayload = {
  id: string;
  name: string;
  order: number;
  sets: SetPayload[];
};

export type WorkoutPayload = {
  id: string;
  date: string;
  notes: string | null;
  exercises: ExercisePayload[];
  totalVolumeKg: number;
  setCount: number;
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
  muscleGroup: string;
  defaultWeight: number | null;
  defaultReps: number | null;
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
  volumeKg: number;
  workouts: number;
  sports: number;
  supplements: number;
};

export type TopExercise = {
  name: string;
  volumeKg: number;
  sets: number;
  workouts: number;
};

export type AnalyticsSummary = {
  days: number;
  periodLabel: string;
  totalWorkouts: number;
  totalSets: number;
  totalVolumeKg: number;
  totalSports: number;
  totalSportMinutes: number;
  totalSportKm: number;
  supplementDays: number;
  supplementStreak: number;
  gymStreak: number;
  sportStreak: number;
  trends: {
    workouts: number;
    sets: number;
    volumeKg: number;
    sports: number;
    supplements: number;
  };
  daily: DailyActivityPoint[];
  topExercises: TopExercise[];
};

export type ProgressionPoint = {
  date: string;
  maxWeight: number;
  estimatedOneRm: number;
  bestSetReps: number;
};

export type AppTab = "home" | "log" | "analytics" | "settings";

export type AppState = {
  today: string;
  todayWorkout: WorkoutPayload | null;
  todaySports: SportSessionPayload[];
  todaySupplements: SupplementPayload[];
  workouts: WorkoutPayload[];
  sports: SportSessionPayload[];
  supplements: SupplementPayload[];
  customExercises: CustomExercisePayload[];
  customSupplements: CustomSupplementPayload[];
};
