export function parseDecimal(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed.replace(",", "."));
  return Number.isFinite(numeric) ? numeric : null;
}

export function parseOptionalDecimal(
  value: string | number | null | undefined,
  label: string,
): number | null {
  const numeric = parseDecimal(value);
  if (value == null || String(value).trim() === "") return null;
  if (numeric == null) throw new Error(`${label} must be a number.`);
  return numeric;
}
