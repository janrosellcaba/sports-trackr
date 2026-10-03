import type { TrainerPayload } from "@/lib/trainerPayload";

const REPLY_LANGUAGE = "English";

function oneLine(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function commentLine(depth: number, text: string) {
  return `${"  ".repeat(depth)}// ${oneLine(text)}`;
}

function jsonValue(value: unknown, depth: number): string {
  const raw = JSON.stringify(value, null, 2);
  const pad = "  ".repeat(depth);
  if (!raw.includes("\n")) return raw;
  return raw
    .split("\n")
    .map((line, i) => (i === 0 ? line : pad + line))
    .join("\n");
}

function field(
  depth: number,
  comment: string,
  key: string,
  value: unknown,
  comma: boolean,
) {
  const pad = "  ".repeat(depth);
  return `${commentLine(depth, comment)}\n${pad}${JSON.stringify(key)}: ${jsonValue(value, depth)}${comma ? "," : ""}`;
}

function objectField(
  depth: number,
  comment: string,
  key: string,
  inner: string[],
  comma: boolean,
) {
  const pad = "  ".repeat(depth);
  return `${commentLine(depth, comment)}\n${pad}${JSON.stringify(key)}: {\n${inner.join("\n")}\n${pad}}${comma ? "," : ""}`;
}

function emitCommentedSnapshot(
  payload: TrainerPayload,
  replyLanguage: string,
  generatedAt: string,
) {
  return [
    "{",
    field(1, "When this copy was made (UTC date)", "generatedAt", generatedAt, true),
    field(1, "Language you must reply in", "language", replyLanguage, true),
    field(1, "Human label for the selected window", "period", payload.period, true),
    objectField(
      1,
      "Display units. Use these instead of inventing kg/lb or km/mi.",
      "units",
      [
        field(2, "Mass unit for PRs and gym numbers", "mass", payload.units.mass, true),
        field(2, "Distance unit for sport totals", "distance", payload.units.distance, false),
      ],
      true,
    ),
    objectField(
      1,
      "How to read the training numbers",
      "legend",
      [
        field(2, "Sum of muscle intensities (1–5) that day", "gymLoad", payload.legend.gymLoad, true),
        field(2, "1 Light → 5 Wrecked", "intensity", payload.legend.intensity, true),
        field(2, "A day with gym, sport, or both", "activityDay", payload.legend.activityDay, true),
        field(2, "A day with at least one sport session", "sportDay", payload.legend.sportDay, false),
      ],
      true,
    ),
    objectField(
      1,
      "Activity in this window. A piece is omitted (null) when there is not enough data.",
      "activity",
      [
        field(2, "Days with gym, sport, or both", "days", payload.activity.days, true),
        field(2, "Days with no gym and no sport. null for all-time.", "restDays", payload.activity.restDays, true),
        field(2, "Activity days scaled to a 7-day rate. null for all-time.", "perWeek", payload.activity.perWeek, true),
        field(2, "Days with at least one gym session", "gymDays", payload.activity.gymDays, true),
        field(2, "Days with at least one sport session", "sportDays", payload.activity.sportDays, true),
        field(2, "Activity days in the previous window of the same length. null if none.", "previousDays", payload.activity.previousDays, false),
      ],
      true,
    ),
    objectField(
      1,
      "Gym work in this window. previousLoad is omitted (null) when there is no previous window.",
      "gym",
      [
        field(2, "Days with gym", "days", payload.gym.days, true),
        field(2, "Sum of gymLoad across the window", "load", payload.gym.load, true),
        field(2, "Muscle hits logged", "hits", payload.gym.hits, true),
        field(2, "Consecutive gym days ending at the latest logged gym day", "streak", payload.gym.streak, true),
        field(2, "Gym load in the previous window. null if none.", "previousLoad", payload.gym.previousLoad, false),
      ],
      true,
    ),
    objectField(
      1,
      "Sport work in this window. Distance is already in the snapshot distance unit.",
      "sports",
      [
        field(2, "Days with sport", "days", payload.sports.days, true),
        field(2, "Sport sessions logged", "sessions", payload.sports.sessions, true),
        field(2, "Sport days scaled to a 7-day rate. null for all-time.", "perWeek", payload.sports.perWeek, true),
        field(2, "Total sport minutes", "minutes", payload.sports.minutes, true),
        field(2, "Total sport distance in the snapshot distance unit", "distance", payload.sports.distance, false),
      ],
      true,
    ),
    objectField(
      1,
      "Supplement days. This is adherence, not a product list.",
      "supplements",
      [
        field(2, "Days with at least one supplement log", "days", payload.supplements.days, true),
        field(2, "Consecutive supplement days ending at the latest log", "streak", payload.supplements.streak, false),
      ],
      true,
    ),
    field(
      1,
      "Shape score and this week's change. null when there is not enough training history.",
      "shape",
      payload.shape,
      true,
    ),
    field(
      1,
      "Body-weight logs in this window. kg is stored mass; display is already in units.mass. Omitted when empty. Do not invent bodyweight if this is empty.",
      "bodyWeight",
      payload.bodyWeight,
      true,
    ),
    field(
      1,
      "Muscles with the most gymLoad in this window. avgIntensity is 1–5. Omitted when empty.",
      "topMuscles",
      payload.topMuscles,
      true,
    ),
    field(
      1,
      "Best lifts on record (name / lift / date). Not set-by-set logs. Omitted when empty.",
      "personalRecords",
      payload.personalRecords,
      true,
    ),
    field(
      1,
      "One row per day in the window: gymLoad, workouts, sports, supplements. Not set-by-set logs.",
      "daily",
      payload.daily,
      true,
    ),
    field(
      1,
      "Monday-start weeks with gym / sport / rest day counts. Use this as the longer series when the window is short.",
      "weeks",
      payload.weeks,
      false,
    ),
    "}",
  ].join("\n");
}

export function buildAnalyticsAiBrief(
  payload: TrainerPayload,
  opts?: { generatedAt?: string; language?: string },
): string {
  const replyLanguage = opts?.language ?? REPLY_LANGUAGE;
  const generatedAt = opts?.generatedAt ?? new Date().toISOString().slice(0, 10);
  return [
    "You are a precise, blunt, practical strength-and-conditioning coach. You have read hundreds of training logs. You notice junk volume, missing recovery, streak theater, and PRs that do not match weekly work.",
    "",
    "Read the snapshot below. Then:",
    "1) Diagnose the situation in 5–8 sentences, using the numbers.",
    "2) Criticize what looks weak, lazy, or risky. Be specific.",
    "3) Give 3 to 5 actions, ordered by impact. Each one must say why, roughly what it moves, and what to do this week.",
    "4) End with 2–3 questions you still need answered before you can coach more sharply.",
    "",
    "Rules:",
    "- Use only the numbers in the snapshot. Do not invent sessions, PRs, bodyweight, or injuries.",
    "- If something is missing (goal meet, bodyweight, sleep, injuries, program), say so instead of guessing.",
    "- If the period is short or still in progress, diagnose from daily, weeks, streaks, and PRs over time. Treat this window only as a check-in, not as a full season.",
    `- Reply entirely in ${replyLanguage}.`,
    "- No generic hype. No supplement-product pitches.",
    "",
    "How to read the numbers:",
    `- gymLoad: ${payload.legend.gymLoad}.`,
    `- intensity: ${payload.legend.intensity}.`,
    `- activityDay: ${payload.legend.activityDay}.`,
    `- sportDay: ${payload.legend.sportDay}.`,
    "- rest: a day with no gym and no sport.",
    `- units.mass is ${payload.units.mass}; units.distance is ${payload.units.distance}.`,
    "",
    "SNAPSHOT (commented JSON)",
    emitCommentedSnapshot(payload, replyLanguage, generatedAt),
  ].join("\n");
}
