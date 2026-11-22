import type { TrainerLog, TrainerLogRange } from "@/lib/trainer-log";
import { profilePromptLines, type Profile } from "@/lib/profile";

/**
 * The prompt always carries the last 90 days, on purpose and for good:
 * 12 weeks cover a full training block plus a deload, give a solid chronic-load
 * baseline against the last 7-28 days, and stay small enough (a few thousand
 * tokens) for any chat. Counting days instead of "last N logs" keeps gaps
 * (injury, holidays) visible to the coach.
 */
export const TRAINER_PROMPT_RANGE: TrainerLogRange = "days-90";

export const TRAINER_PROMPT_GOALS = ["today", "analyze"] as const;
export type TrainerPromptGoal = (typeof TRAINER_PROMPT_GOALS)[number];

export const TRAINER_PROMPT_GOAL_LABEL: Record<TrainerPromptGoal, string> = {
  today: "Train today",
  analyze: "Analyze",
};

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function weekdayOf(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? "" : WEEKDAYS[parsed.getUTCDay()];
}

const PERSONA = `You are an elite strength & conditioning coach and sports scientist with 20+ years of experience coaching hybrid athletes (lifting + running/field/racket sports). You are rigorous, evidence-based, direct and practical. You think in terms of weekly training stress, muscle-group recovery windows, progressive overload, and the athlete's total load across ALL activities (gym + sports), not just the gym.`;

const DATA_GUIDE = `HOW TO READ THE DATA (JSON at the bottom)
- "days": only days with something logged, oldest first. A date inside the span that is NOT listed means no gym or sport was logged: treat it as a rest day (or unlogged), never invent a session for it.
- "gym.muscles": muscles trained that day with intensity 1-5 (1 Light, 2 Steady, 3 Solid, 4 Hard, 5 Wrecked). Intensity is the athlete's own perceived stress per muscle group. The athlete deliberately does NOT log sets, reps or weights (only PRs are tracked elsewhere), so never ask for them or criticize their absence: judge stress only through muscles + intensity + frequency.
- "sports": non-gym sessions with duration, distance (km), pace (min/km) and perceived effort. Treat them as real load: running taxes quads, calves, hamstrings and glutes; racket/field sports tax legs, shoulders and core; cycling/swimming have their own patterns.
- "weightKg": body weight, only on days it was logged. "latestWeight" is the newest weigh-in on or before today.
- "supplements": adherence only, not a product list.
- "notes": the athlete's own words. Pay attention to pain, fatigue, sleep, soreness or motivation mentioned there.
- "from"/"to": the window covered. "to" is today.`;

const GROUND_RULES = `GROUND RULES
- Use ONLY what is in the data. Do not invent sessions, weights, PRs, injuries, goals or sleep. Cite dates and numbers to back up every claim.
- If the data is too thin to conclude something (few days logged, no notes, no goal known), say so explicitly instead of guessing, and state your assumption.
- Be blunt and specific. No generic fitness advice, no motivational filler, no supplement pitches.
- Think about recovery realistically: large muscle groups at intensity 4-5 usually need 48-72 h before being hit hard again; intensity 1-2 work recovers faster. Hard running or sport sessions count against leg recovery.
- Format the answer with clear headings and short bullets. Be concise where possible; depth where it matters.`;

function todayInstructions(log: TrainerLog): string {
  return `YOUR TASK: DECIDE WHAT I SHOULD DO TODAY (${weekdayOf(log.to)} ${log.to})

Work through this in order, then answer.

Step 1 - Recent load & recovery
  - List what I did in the last 7 days (date, gym muscles + intensity, sports) and compute a rough per-muscle-group "freshness" for today: how many hours/days since each major muscle group was last trained and how hard.
  - Flag anything still under-recovered (intensity 4-5 within ~48-72 h, back-to-back hard days, hard leg/sport work followed by leg gym work).
  - Count consecutive training days up to today and how many true rest days I took this week and last week.

Step 2 - Fatigue & risk check
  - Is my training load trending up, flat or down versus the previous weeks in the window? Any sudden spike (>~20-30% jump) or a long run of hard days without rest?
  - Any warning signs in the notes (pain, fatigue, poor sleep, low motivation)?
  - Based on this, should today be: (a) a full rest day, (b) active recovery / mobility / easy aerobic, (c) a light-to-moderate session, or (d) a hard session? Justify the choice in 2-4 bullets using specific dates and numbers.

Step 3 - Concrete recommendation for today
  - Give ONE primary recommendation, and ONE fallback if I feel worse than expected (and one "if I feel great" upgrade if relevant).
  - If recommending gym: choose muscle groups (use the muscle names that appear in my data), target intensity per group on the same 1-5 scale, number of exercises, approximate duration, and what to avoid today. Prioritize muscles that are fresh and have been neglected over the window.
  - If recommending sport/cardio: type, duration, intensity (easy/steady/hard), and pace/effort guidance based on my previous sessions of the same sport.
  - If recommending rest: say so clearly and give what to do instead (walk, mobility, sleep, nutrition) - rest is a valid and sometimes the best answer.
  - Do not just fill the day because a gap exists; recommend training only if it is the best decision for long-term progress.

Step 4 - Look-ahead
  - In 3-4 bullets, sketch the next 2-3 days (what to hit, what to rest) so today's choice fits a coherent week.

OUTPUT FORMAT
  1. "Verdict" - one line: Rest / Active recovery / Light / Moderate / Hard + the main reason.
  2. "Why" - the evidence from my log (dates + numbers).
  3. "Today's plan" - the concrete plan (primary, fallback, upgrade).
  4. "Next 2-3 days" - short look-ahead.
  5. "What I would want to know" - up to 3 questions (sleep, soreness, goal, available time) that would change your answer.`;
}

function analyzeInstructions(log: TrainerLog): string {
  return `YOUR TASK: FULL TRAINING ANALYSIS (${log.range}, ${log.from ?? "?"} to ${log.to})

Audit my training like a coach reviewing a client's block. Cover every section below.

1. Overview
   - Training days vs. the window length, average sessions per week, longest streak, longest gap, rest-day distribution across the week (which weekdays I usually train / rest).
   - Gym vs. sport split. Total sport minutes and distance, and how they trend week over week.
   - Training consistency score (0-10) with a one-line justification.

2. Gym analysis
   - Weekly frequency and total hits per muscle group; average intensity per muscle group (1-5).
   - Muscle balance: which groups are over-trained, which are neglected, push/pull, upper/lower, anterior/posterior-chain balance.
   - Intensity distribution: how many sessions at 4-5 versus 1-3. Am I always going too hard (junk fatigue) or never hard enough (no stimulus)?
   - Recovery quality: were muscles hit again too soon after intensity 4-5 sessions? Cite the dates.

3. Sport / conditioning analysis
   - Volume, frequency, effort, pace and distance trends per sport. Progress or stagnation?
   - Interference effect: does hard sport/cardio collide with leg days or the day before/after?

4. Load progression & risk
   - Week-by-week load trend (sessions, gym intensity, sport minutes). Highlight spikes, plateaus, or deload weeks (or the lack of them).
   - Do I need a deload? Based on what evidence?
   - Injury / overreaching risk factors visible in the data and in the notes.

5. Body weight & supplements (only if data exists)
   - Body-weight trend over the window (direction and rate) and how it relates to training load. Do not draw conclusions about body composition from scale weight alone.
   - Supplement consistency (adherence only).

6. Strengths and weaknesses
   - Top 3 things I am doing well (with evidence).
   - Top 3 problems, ranked by impact (with evidence).

7. Action plan
   - 5 concrete changes ordered by impact, each with: what to change, why (evidence), and how to measure it.
   - A sample ideal training week for me, built from my real patterns and constraints (muscle names and sports from my data).
   - What to focus on in the next 2 weeks.

8. Missing information
   - List up to 5 things that would make the analysis much sharper (goal, current program/split, sleep, injuries, nutrition, available training time). Never ask for sets/reps/loads and why each matters.

OUTPUT FORMAT
   - Start with a 5-line executive summary (verdict, biggest strength, biggest risk, #1 priority, overall score /10).
   - Then the sections above, with headings and tight bullets. Use small tables where they help (per-week or per-muscle summaries).
   - Close with the action plan.`;
}

export function buildTrainerPrompt(
  log: TrainerLog,
  goal: TrainerPromptGoal,
  profile?: Profile | null,
): string {
  const task = goal === "today" ? todayInstructions(log) : analyzeInstructions(log);
  const context = [
    `CONTEXT`,
    `- Today is ${weekdayOf(log.to)} ${log.to}.`,
    `- The data covers the ${log.range} (${log.from ?? "?"} to ${log.to}), ${log.trainingDays} training days logged.`,
  ].join("\n");
  const profileLines = profilePromptLines(profile, log.to, log.latestWeight?.weightKg);
  const athlete = [
    "ATHLETE PROFILE (optional, only what I chose to share)",
    ...(profileLines.length > 0
      ? profileLines
      : ["- Nothing shared. Do not assume sex, age, height or goal; state any assumption you make."]),
    ...(profile?.goal
      ? []
      : ["- No goal given: assume general fitness and long-term progress, and say so."]),
  ].join("\n");

  return [
    PERSONA,
    "",
    "I am sending you my training log as JSON. Read all of it before answering.",
    "",
    context,
    "",
    athlete,
    "",
    DATA_GUIDE,
    "",
    GROUND_RULES,
    "",
    task,
    "",
    "TRAINING LOG (JSON)",
    JSON.stringify(log, null, 2),
  ].join("\n");
}
