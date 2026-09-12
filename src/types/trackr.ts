export const CARDIO_TYPES = [
  "RUNNING",
  "CYCLING",
  "SWIMMING",
  "PADEL",
  "TENNIS",
] as const;

export const INTENSITY_LEVELS = ["LOW", "MODERATE", "HIGH"] as const;

export type CardioType = (typeof CARDIO_TYPES)[number];
export type IntensityLevel = (typeof INTENSITY_LEVELS)[number];

export type CardioActivityPayload = {
  id: string;
  type: CardioType;
  durationMinutes: number;
  intensity: IntensityLevel;
  notes: string | null;
  date: string;
};

export type LogCardioActivityInput = {
  id?: string;
  type: CardioType;
  durationMinutes: number;
  intensity: IntensityLevel;
  notes?: string;
  date?: Date | string;
};

export type SetPayload = {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
};

export type ExercisePayload = {
  id: string;
  machineName: string;
  order: number;
  sets: SetPayload[];
};

export type SessionMode = "LIVE" | "MANUAL";

export type SessionPayload = {
  id: string;
  startTime: string;
  endTime: string | null;
  notes: string | null;
  mode: SessionMode;
  exercises: ExercisePayload[];
};

export const SUPPLEMENT_TYPES = [
  "WHEY_PROTEIN",
  "PRE_WORKOUT",
  "CREATINE",
] as const;

export type SupplementType = (typeof SUPPLEMENT_TYPES)[number] | "CUSTOM";

export type SupplementPayload = {
  id: string;
  type: SupplementType;
  label: string;
  catalogId: string | null;
  amountGrams: number | null;
  scoops: number | null;
  notes: string | null;
  date: string;
};

export type LogSupplementInput = {
  id?: string;
  type: SupplementType;
  label?: string;
  catalogId?: string;
  amountGrams?: number;
  scoops?: number;
  notes?: string;
  date?: Date | string;
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

export type DailyActivityPoint = {
  date: string;
  gymMinutes: number;
  cardioMinutes: number;
  volumeKg: number;
};

export type AnalyticsSummary = {
  days: number;
  totalSessions: number;
  totalCardioMinutes: number;
  totalVolumeKg: number;
  supplementComplianceDays: number;
  supplementStreak: number;
  trends: {
    sessions: number;
    cardioMinutes: number;
    volumeKg: number;
    supplements: number;
  };
  daily: DailyActivityPoint[];
};

export type HistorySet = {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
};

export type HistoryExercise = {
  id: string;
  machineName: string;
  order: number;
  sets: HistorySet[];
  volumeKg: number;
};

export type WorkoutHistoryItem = {
  id: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  durationMinutes: number;
  totalVolumeKg: number;
  exerciseCount: number;
  setCount: number;
  exercises: HistoryExercise[];
};

export type CardioHistoryItem = {
  id: string;
  type: string;
  durationMinutes: number;
  intensity: string;
  notes: string | null;
  date: string;
};

export type WorkoutHistoryFeed = {
  sessions: WorkoutHistoryItem[];
  activities: CardioHistoryItem[];
};

export type ProgressionPoint = {
  date: string;
  maxWeight: number;
  estimatedOneRm: number;
  bestSetReps: number;
};

export type AdminUserRow = {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  _count: {
    sessions: number;
    activities: number;
  };
};

export type AdminStats = {
  totalUsers: number;
  totalWorkouts: number;
  totalCardio: number;
  usersList: AdminUserRow[];
};
