type ExportPayload = {
  gymSessions?: Array<{
    id: string;
    date: string;
    notes: string | null;
    hits?: Array<{
      muscleName: string;
      intensity: number;
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
  muscles?: Array<{
    name: string;
    sortOrder: number;
  }>;
  customExercises?: Array<{
    name: string;
    muscleName: string | null;
    workingWeight: number | null;
    workingReps: number | null;
    prWeight: number | null;
    prReps: number | null;
    prDate: string | null;
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
  const sessionRows: Array<Array<unknown>> = [];
  const hitRows: Array<Array<unknown>> = [];

  for (const session of data.gymSessions ?? []) {
    sessionRows.push([
      session.id,
      session.date,
      session.notes ?? "",
      session.hits?.length ?? 0,
    ]);
    for (const hit of session.hits ?? []) {
      hitRows.push([session.date, hit.muscleName, hit.intensity]);
    }
  }

  return [
    "# gymSessions",
    rowsToCsv(["id", "date", "notes", "hitCount"], sessionRows),
    "",
    "# muscleHits",
    rowsToCsv(["date", "muscle", "intensity"], hitRows),
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
    "# muscles",
    rowsToCsv(
      ["name", "sortOrder"],
      (data.muscles ?? []).map((item) => [item.name, item.sortOrder]),
    ),
    "",
    "# customExercises",
    rowsToCsv(
      [
        "name",
        "muscleName",
        "workingWeight",
        "workingReps",
        "prWeight",
        "prReps",
        "prDate",
      ],
      (data.customExercises ?? []).map((item) => [
        item.name,
        item.muscleName ?? "",
        item.workingWeight ?? "",
        item.workingReps ?? "",
        item.prWeight ?? "",
        item.prReps ?? "",
        item.prDate ?? "",
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
