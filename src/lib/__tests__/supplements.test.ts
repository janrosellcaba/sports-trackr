import { describe, expect, it } from "vitest";
import {
  amountFromDose,
  parseSupplementIntakeInput,
  supplementFromName,
} from "@/lib/supplements";

describe("parseSupplementIntakeInput", () => {
  it("stores protein grams with a g suffix", () => {
    expect(
      parseSupplementIntakeInput({
        type: "protein",
        amount: "24",
        date: "2026-09-20",
      }),
    ).toEqual({
      name: "Protein shake",
      dose: "24g",
      date: "2026-09-20",
    });
    expect(
      parseSupplementIntakeInput({
        type: "protein",
        amount: "24.5 grams",
        date: "2026-09-20",
      }).dose,
    ).toBe("24.5g");
  });

  it("stores energy-drink volume in millilitres", () => {
    expect(
      parseSupplementIntakeInput({
        type: "energy",
        amount: "250ml",
        date: "2026-09-20",
      }),
    ).toEqual({
      name: "Energy drink",
      dose: "250ml",
      date: "2026-09-20",
    });
    expect(() =>
      parseSupplementIntakeInput({
        type: "energy",
        amount: "250.5",
        date: "2026-09-20",
      }),
    ).toThrow("Amount (ml) must be a whole number.");
  });

  it("requires a coffee size", () => {
    expect(
      parseSupplementIntakeInput({
        type: "coffee",
        amount: "medium",
        date: "2026-09-20",
      }).dose,
    ).toBe("Medium");
    expect(() =>
      parseSupplementIntakeInput({
        type: "coffee",
        amount: "",
        date: "2026-09-20",
      }),
    ).toThrow("Pick a coffee size.");
  });
});

describe("amountFromDose", () => {
  it("strips units so the form can re-edit a log", () => {
    expect(amountFromDose("protein", "24g")).toBe("24");
    expect(amountFromDose("energy", "250ml")).toBe("250");
    expect(amountFromDose("coffee", "Large")).toBe("Large");
  });
});

describe("supplementFromName", () => {
  it("matches the hardcoded labels", () => {
    expect(supplementFromName("Protein shake")?.id).toBe("protein");
    expect(supplementFromName("Creatine")).toBeNull();
  });
});
