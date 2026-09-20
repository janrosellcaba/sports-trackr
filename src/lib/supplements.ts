import { isDateKey } from "@/lib/calculations";
import { parseDecimal } from "@/lib/numbers";
import { trimNumber } from "@/lib/units";

export const SUPPLEMENT_IDS = ["protein", "energy", "coffee"] as const;
export type SupplementId = (typeof SUPPLEMENT_IDS)[number];

export const COFFEE_SIZES = ["Espresso", "Small", "Medium", "Large"] as const;
export type CoffeeSize = (typeof COFFEE_SIZES)[number];

export type SupplementDefinition = {
  id: SupplementId;
  name: string;
  amountKind: "grams" | "ml" | "size";
  placeholder?: string;
};

export const SUPPLEMENTS: SupplementDefinition[] = [
  {
    id: "protein",
    name: "Protein shake",
    amountKind: "grams",
    placeholder: "24",
  },
  {
    id: "energy",
    name: "Energy drink",
    amountKind: "ml",
    placeholder: "250",
  },
  {
    id: "coffee",
    name: "Coffee",
    amountKind: "size",
  },
];

export function isSupplementId(value: unknown): value is SupplementId {
  return (
    typeof value === "string" &&
    (SUPPLEMENT_IDS as readonly string[]).includes(value)
  );
}

export function supplementDefinition(id: string): SupplementDefinition | null {
  return SUPPLEMENTS.find((item) => item.id === id) ?? null;
}

export function supplementFromName(name: string): SupplementDefinition | null {
  const key = name.trim().toLowerCase();
  return SUPPLEMENTS.find((item) => item.name.toLowerCase() === key) ?? null;
}

export function isCoffeeSize(value: unknown): value is CoffeeSize {
  return (
    typeof value === "string" &&
    (COFFEE_SIZES as readonly string[]).includes(value)
  );
}

function parsePositiveAmount(raw: string, label: string): number {
  const numeric = parseDecimal(raw);
  if (numeric == null || numeric <= 0) {
    throw new Error(`${label} is required.`);
  }
  return numeric;
}

function stripUnit(raw: string, unit: RegExp): string {
  return raw.trim().replace(unit, "").trim();
}

export function formatProteinDose(grams: number): string {
  return `${trimNumber(grams)}g`;
}

export function formatEnergyDose(ml: number): string {
  if (!Number.isInteger(ml)) {
    throw new Error("Amount (ml) must be a whole number.");
  }
  return `${ml}ml`;
}

export function parseSupplementAmount(
  type: SupplementId,
  amountRaw: string,
): string {
  const amount = amountRaw.trim();
  if (type === "protein") {
    const grams = parsePositiveAmount(
      stripUnit(amount, /\s*(g|grams?)\s*$/i),
      "Protein (g)",
    );
    return formatProteinDose(grams);
  }
  if (type === "energy") {
    const ml = parsePositiveAmount(
      stripUnit(amount, /\s*ml\s*$/i),
      "Amount (ml)",
    );
    if (!Number.isInteger(ml)) {
      throw new Error("Amount (ml) must be a whole number.");
    }
    return formatEnergyDose(ml);
  }
  const size = COFFEE_SIZES.find(
    (item) => item.toLowerCase() === amount.toLowerCase(),
  );
  if (!size) throw new Error("Pick a coffee size.");
  return size;
}

export function amountFromDose(type: SupplementId, dose: string): string {
  const trimmed = dose.trim();
  if (type === "protein") {
    return stripUnit(trimmed, /\s*(g|grams?)\s*$/i);
  }
  if (type === "energy") {
    return stripUnit(trimmed, /\s*ml\s*$/i);
  }
  const size = COFFEE_SIZES.find(
    (item) => item.toLowerCase() === trimmed.toLowerCase(),
  );
  return size ?? "";
}

export type ParsedSupplementIntake = {
  name: string;
  dose: string;
  date: string;
};

export function parseSupplementIntakeInput(input: {
  type: string;
  amount: string;
  date: string;
}): ParsedSupplementIntake {
  const definition = supplementDefinition(input.type);
  if (!definition) throw new Error("Pick a supplement.");
  if (!isDateKey(input.date)) throw new Error("Invalid date.");
  return {
    name: definition.name,
    dose: parseSupplementAmount(definition.id, input.amount),
    date: input.date,
  };
}
