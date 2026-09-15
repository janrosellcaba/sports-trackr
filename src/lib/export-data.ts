type ExportPayload = {
  workouts?: Array<{
    id: string;
    date: string;
    notes: string | null;
    exercises?: Array<{
      name: string;
      sets?: Array<{
        setNumber: number;
        weight: number;
        reps: number;
      }>;
    }>;
  }>;
  supplements?: Array<{
    name: string;
    dose: string;
    date: string;
  }>;
  sports?: Array<{
    date: string;
    type: string;
    durationMinutes: number | null;
    distanceKm: number | null;
    distanceMeters: number | null;
    pace: string | null;
    effort: string | null;
    notes: string | null;
  }>;
  customExercises?: Array<{
    name: string;
    muscleGroup: string;
    defaultWeight: number | null;
    defaultReps: number | null;
  }>;
  customSupplements?: Array<{
    name: string;
    defaultDose: string;
  }>;
};

function csvEscape(value: unknown): string {
  const raw = value == null ? "" : String(value);
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function rowsToCsv(headers: string[], rows: Array<Array<unknown>>): string {
  return [
    headers.join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");
}

export function buildExportCsv(data: ExportPayload): string {
  const workoutRows: Array<Array<unknown>> = [];
  const setRows: Array<Array<unknown>> = [];

  for (const workout of data.workouts ?? []) {
    workoutRows.push([
      workout.id,
      workout.date,
      workout.notes ?? "",
      workout.exercises?.length ?? 0,
    ]);
    for (const exercise of workout.exercises ?? []) {
      for (const set of exercise.sets ?? []) {
        setRows.push([
          workout.date,
          exercise.name,
          set.setNumber,
          set.weight,
          set.reps,
        ]);
      }
    }
  }

  return [
    "# workouts",
    rowsToCsv(["id", "date", "notes", "exerciseCount"], workoutRows),
    "",
    "# sets",
    rowsToCsv(["date", "exercise", "setNumber", "weight", "reps"], setRows),
    "",
    "# supplements",
    rowsToCsv(
      ["name", "dose", "date"],
      (data.supplements ?? []).map((item) => [item.name, item.dose, item.date]),
    ),
    "",
    "# sports",
    rowsToCsv(
      [
        "date",
        "type",
        "durationMinutes",
        "distanceKm",
        "distanceMeters",
        "pace",
        "effort",
        "notes",
      ],
      (data.sports ?? []).map((item) => [
        item.date,
        item.type,
        item.durationMinutes ?? "",
        item.distanceKm ?? "",
        item.distanceMeters ?? "",
        item.pace ?? "",
        item.effort ?? "",
        item.notes ?? "",
      ]),
    ),
    "",
    "# customExercises",
    rowsToCsv(
      ["name", "muscleGroup", "defaultWeight", "defaultReps"],
      (data.customExercises ?? []).map((item) => [
        item.name,
        item.muscleGroup,
        item.defaultWeight ?? "",
        item.defaultReps ?? "",
      ]),
    ),
    "",
    "# customSupplements",
    rowsToCsv(
      ["name", "defaultDose"],
      (data.customSupplements ?? []).map((item) => [item.name, item.defaultDose]),
    ),
  ].join("\n");
}
