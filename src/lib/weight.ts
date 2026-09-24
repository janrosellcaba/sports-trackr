import { parseDecimal } from "@/lib/numbers";
import { roundTo } from "@/lib/units";

export const MIN_BODY_WEIGHT_KG = 20;
export const MAX_BODY_WEIGHT_KG = 400;

export function parseBodyWeightKg(value: number | string | null | undefined): number {
  const numeric = parseDecimal(value);
  if (numeric == null) throw new Error("Weight is required.");
  const kg = roundTo(numeric, 3);
  if (kg < MIN_BODY_WEIGHT_KG || kg > MAX_BODY_WEIGHT_KG) {
    throw new Error("That weight looks off.");
  }
  return kg;
}

export function weightChartDomain(values: number[]): [number, number] | null {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return null;
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const span = max - min;
  const pad = span === 0 ? Math.max(Math.abs(min) * 0.02, 0.5) : span * 0.25;
  return [roundTo(min - pad, 2), roundTo(max + pad, 2)];
}
