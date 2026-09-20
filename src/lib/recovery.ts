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
