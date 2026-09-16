export const MASS_UNITS = ["kg", "lb"] as const;
export type MassUnit = (typeof MASS_UNITS)[number];

export const DISTANCE_UNITS = ["km", "mi"] as const;
export type DistanceUnit = (typeof DISTANCE_UNITS)[number];

export const DEFAULT_MASS_UNIT: MassUnit = "kg";
export const DEFAULT_DISTANCE_UNIT: DistanceUnit = "km";

const LB_PER_KG = 2.2046226218;
const KM_PER_MILE = 1.609344;
const YD_PER_M = 1.0936132983377;

export function isMassUnit(value: unknown): value is MassUnit {
  return value === "kg" || value === "lb";
}

export function isDistanceUnit(value: unknown): value is DistanceUnit {
  return value === "km" || value === "mi";
}

export function resolveMassUnit(value: string | null | undefined): MassUnit {
  return isMassUnit(value) ? value : DEFAULT_MASS_UNIT;
}

export function resolveDistanceUnit(
  value: string | null | undefined,
): DistanceUnit {
  return isDistanceUnit(value) ? value : DEFAULT_DISTANCE_UNIT;
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function trimNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toFixed(2)));
}

export function kgToDisplay(kg: number, unit: MassUnit): number {
  if (unit === "kg") return roundTo(kg, 2);
  return roundTo(kg * LB_PER_KG, 1);
}

export function displayToKg(value: number, unit: MassUnit): number {
  if (unit === "kg") return roundTo(value, 3);
  return roundTo(value / LB_PER_KG, 3);
}

export function kmToDisplay(km: number, unit: DistanceUnit): number {
  if (unit === "km") return roundTo(km, 2);
  return roundTo(km / KM_PER_MILE, 2);
}

export function displayToKm(value: number, unit: DistanceUnit): number {
  if (unit === "km") return roundTo(value, 3);
  return roundTo(value * KM_PER_MILE, 3);
}

export function metersToDisplay(meters: number, unit: DistanceUnit): number {
  if (unit === "km") return roundTo(meters, 1);
  return roundTo(meters * YD_PER_M, 1);
}

export function displayToMeters(value: number, unit: DistanceUnit): number {
  if (unit === "km") return roundTo(value, 1);
  return roundTo(value / YD_PER_M, 1);
}

export function massLabel(unit: MassUnit): string {
  return unit;
}

export function distanceLabel(unit: DistanceUnit): string {
  return unit;
}

export function shortDistanceLabel(unit: DistanceUnit): string {
  return unit === "mi" ? "yd" : "m";
}

export function formatMass(kg: number | null | undefined, unit: MassUnit): string {
  if (kg == null) return "";
  return `${trimNumber(kgToDisplay(kg, unit))}${unit}`;
}

export function formatInputNumber(value: number): string {
  return trimNumber(value);
}

function padSeconds(seconds: number): string {
  return String(seconds).padStart(2, "0");
}

export function paceToSeconds(pace: string): number | null {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(pace.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function secondsToPace(totalSeconds: number): string {
  const safe = Math.max(1, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  if (seconds === 60) return `${minutes + 1}:00`;
  return `${minutes}:${padSeconds(seconds)}`;
}

export function displayPace(
  storedPerKm: string | null | undefined,
  unit: DistanceUnit,
): string {
  if (!storedPerKm) return "";
  if (unit === "km") return storedPerKm;
  const seconds = paceToSeconds(storedPerKm);
  if (seconds == null) return storedPerKm;
  return secondsToPace(seconds * KM_PER_MILE);
}

export function canonicalPace(
  displayed: string,
  unit: DistanceUnit,
): string | null {
  const trimmed = displayed.trim();
  if (!trimmed) return null;
  if (unit === "km") return trimmed;
  const seconds = paceToSeconds(trimmed) ?? paceToSeconds(normalizeLoosePace(trimmed));
  if (seconds == null) return trimmed;
  return secondsToPace(seconds / KM_PER_MILE);
}

function normalizeLoosePace(raw: string): string {
  const decimal = Number(raw.replace(",", "."));
  if (!Number.isFinite(decimal) || decimal <= 0) return raw;
  const minutes = Math.floor(decimal);
  const seconds = Math.round((decimal - minutes) * 60);
  if (seconds === 60) return `${minutes + 1}:00`;
  return `${minutes}:${padSeconds(seconds)}`;
}
