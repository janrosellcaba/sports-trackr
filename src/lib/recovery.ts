import { intensityLabel } from "@/lib/muscles";
import { parseISODate } from "@/lib/calculations";

export type MuscleRecovery = {
  muscleId: string;
  lastDate: string;
  lastIntensity: number;
  daysAgo: number;
};

export function daysBetween(earlier: string, later: string): number {
  const start = parseISODate(earlier).getTime();
  const end = parseISODate(later).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.round((end - start) / 86_400_000);
}

export function formatRecoveryShort(daysAgo: number): string {
  if (daysAgo <= 0) return "today";
  return `${daysAgo}d`;
}

export function formatRecoveryDetail(recovery: {
  daysAgo: number;
  lastIntensity: number;
}): string {
  const label = intensityLabel(recovery.lastIntensity);
  return `${formatRecoveryShort(recovery.daysAgo)} · ${recovery.lastIntensity}${
    label ? ` ${label}` : ""
  }`;
}

export function recoveryAriaLabel(
  muscleName: string,
  hit: { intensity: number } | null | undefined,
  recovery: MuscleRecovery | null | undefined,
): string {
  if (hit) {
    const label = intensityLabel(hit.intensity);
    return `${muscleName}, ${hit.intensity}${label ? ` ${label}` : ""} this session`;
  }
  if (recovery) {
    return `${muscleName}, last hit ${formatRecoveryShort(recovery.daysAgo)} ago`;
  }
  return `${muscleName}, not logged yet`;
}

export type RecoveryStatus = "recovering" | "ready" | "neglected";

export type MuscleRecoveryRow = {
  muscleId: string;
  name: string;
  status: RecoveryStatus;
  /** null when the muscle has never been logged. */
  daysAgo: number | null;
  lastIntensity: number | null;
  /** Days still needed before it is fully recovered (0 when ready). */
  daysLeft: number;
};

export const NEGLECTED_AFTER_DAYS = 10;

/** Rest days a muscle needs after a hit, by intensity (1 Light … 5 Wrecked). */
export function restDaysFor(intensity: number): number {
  if (intensity >= 5) return 4;
  if (intensity === 4) return 3;
  if (intensity === 3) return 2;
  return 1;
}

export function recoveryRows(
  muscles: { id: string; name: string }[],
  recovery: MuscleRecovery[],
): MuscleRecoveryRow[] {
  const byMuscle = new Map(recovery.map((item) => [item.muscleId, item]));
  const rows = muscles.map((muscle): MuscleRecoveryRow => {
    const last = byMuscle.get(muscle.id);
    if (!last) {
      return {
        muscleId: muscle.id,
        name: muscle.name,
        status: "neglected",
        daysAgo: null,
        lastIntensity: null,
        daysLeft: 0,
      };
    }
    const daysLeft = Math.max(0, restDaysFor(last.lastIntensity) - last.daysAgo);
    const status: RecoveryStatus =
      daysLeft > 0
        ? "recovering"
        : last.daysAgo >= NEGLECTED_AFTER_DAYS
          ? "neglected"
          : "ready";
    return {
      muscleId: muscle.id,
      name: muscle.name,
      status,
      daysAgo: last.daysAgo,
      lastIntensity: last.lastIntensity,
      daysLeft,
    };
  });
  const order: Record<RecoveryStatus, number> = {
    recovering: 0,
    ready: 1,
    neglected: 2,
  };
  return rows.sort(
    (a, b) =>
      order[a.status] - order[b.status] ||
      (a.status === "recovering"
        ? b.daysLeft - a.daysLeft
        : (a.daysAgo ?? Infinity) - (b.daysAgo ?? Infinity)) ||
      a.name.localeCompare(b.name),
  );
}
