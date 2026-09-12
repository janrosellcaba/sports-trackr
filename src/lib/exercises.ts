export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Legs"
  | "Shoulders"
  | "Arms"
  | "Core"
  | "Other";

export const MUSCLE_FILTERS = [
  "All",
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
  "Other",
] as const;

export type MuscleFilter = (typeof MUSCLE_FILTERS)[number];

export const EXERCISE_CATALOG: {
  name: string;
  category: MuscleGroup;
}[] = [
  { name: "Bench Press", category: "Chest" },
  { name: "Incline Dumbbell Press", category: "Chest" },
  { name: "Chest Fly", category: "Chest" },
  { name: "Push-Up", category: "Chest" },
  { name: "Lat Pulldown", category: "Back" },
  { name: "Cable Row", category: "Back" },
  { name: "Pull-Up", category: "Back" },
  { name: "Deadlift", category: "Back" },
  { name: "Squat", category: "Legs" },
  { name: "Leg Press", category: "Legs" },
  { name: "Romanian Deadlift", category: "Legs" },
  { name: "Leg Curl", category: "Legs" },
  { name: "Calf Raise", category: "Legs" },
  { name: "Lateral Raises", category: "Shoulders" },
  { name: "Overhead Press", category: "Shoulders" },
  { name: "Face Pull", category: "Shoulders" },
  { name: "Bicep Curl", category: "Arms" },
  { name: "Tricep Pushdown", category: "Arms" },
  { name: "Skull Crusher", category: "Arms" },
  { name: "Hammer Curl", category: "Arms" },
  { name: "Plank", category: "Core" },
  { name: "Cable Crunch", category: "Core" },
  { name: "Hanging Leg Raise", category: "Core" },
];
