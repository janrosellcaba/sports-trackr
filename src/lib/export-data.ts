type ExportPayload = {
  sessions?: Array<{
    id: string;
    startTime: Date | string;
    endTime: Date | string | null;
    notes: string | null;
    mode?: string;
    exercises?: Array<{
      id: string;
      machineName: string;
      sets?: Array<{
        setNumber: number;
        weight: number;
        reps: number;
        rpe: number | null;
      }>;
    }>;
  }>;
  activities?: Array<{
    type: string;
    durationMinutes: number;
    intensity: string;
    notes: string | null;
    date: Date | string;
  }>;
  supplements?: Array<{
    type: string;
    label?: string | null;
    amountGrams: number | null;
    scoops: number | null;
    notes: string | null;
    date: Date | string;
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
    iconOrType: string;
  }>;
};

function csvEscape(value: unknown): string {
  const raw = value == null ? "" : String(value);
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function toIso(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function rowsToCsv(headers: string[], rows: Array<Array<unknown>>): string {
  return [
    headers.join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");
}

export function buildExportCsv(data: ExportPayload): string {
  const sessionRows: Array<Array<unknown>> = [];
  const setRows: Array<Array<unknown>> = [];

  for (const session of data.sessions ?? []) {
    sessionRows.push([
      session.id,
      toIso(session.startTime),
      toIso(session.endTime),
      session.mode ?? "LIVE",
      session.notes ?? "",
      session.exercises?.length ?? 0,
    ]);
    for (const exercise of session.exercises ?? []) {
      for (const set of exercise.sets ?? []) {
        setRows.push([
          session.id,
          exercise.machineName,
          set.setNumber,
          set.weight,
          set.reps,
          set.rpe ?? "",
        ]);
      }
    }
  }

  const sections = [
    "# sessions",
    rowsToCsv(
      ["id", "startTime", "endTime", "mode", "notes", "exerciseCount"],
      sessionRows,
    ),
    "",
    "# sets",
    rowsToCsv(
      ["sessionId", "exercise", "setNumber", "weight", "reps", "rpe"],
      setRows,
    ),
    "",
    "# cardio",
    rowsToCsv(
      ["type", "durationMinutes", "intensity", "notes", "date"],
      (data.activities ?? []).map((item) => [
        item.type,
        item.durationMinutes,
        item.intensity,
        item.notes ?? "",
        toIso(item.date),
      ]),
    ),
    "",
    "# supplements",
    rowsToCsv(
      ["type", "label", "amountGrams", "scoops", "notes", "date"],
      (data.supplements ?? []).map((item) => [
        item.type,
        item.label ?? "",
        item.amountGrams ?? "",
        item.scoops ?? "",
        item.notes ?? "",
        toIso(item.date),
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
      ["name", "defaultDose", "iconOrType"],
      (data.customSupplements ?? []).map((item) => [
        item.name,
        item.defaultDose,
        item.iconOrType,
      ]),
    ),
  ];

  return sections.join("\n");
}
