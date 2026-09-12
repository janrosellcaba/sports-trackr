import { describe, expect, it } from "vitest";
import {
  mergeExerciseCatalog,
  mergeSupplementCatalog,
  parseCustomExerciseInput,
  parseCustomSupplementInput,
  parseDoseHint,
  validateExerciseName,
} from "@/lib/catalog";

describe("custom exercise CRUD validation", () => {
  it("accepts a well-formed custom exercise", () => {
    expect(
      parseCustomExerciseInput({
        name: "  Belt Squat  ",
        muscleGroup: "legs",
        defaultWeight: 80,
        defaultReps: 8,
      }),
    ).toEqual({
      name: "Belt Squat",
      muscleGroup: "LEGS",
      defaultWeight: 80,
      defaultReps: 8,
    });
  });

  it("rejects short names and invalid defaults", () => {
    expect(validateExerciseName("x")).toBe("Name must be at least 2 characters.");
    expect(() =>
      parseCustomExerciseInput({ name: "Hack Squat", muscleGroup: "LEGS", defaultWeight: -1 }),
    ).toThrow("Default weight must be a non-negative number.");
    expect(() =>
      parseCustomExerciseInput({ name: "Hack Squat", muscleGroup: "LEGS", defaultReps: 0 }),
    ).toThrow("Default reps must be a positive integer.");
  });
});

describe("custom supplement CRUD validation", () => {
  it("requires a name and dose, defaulting the icon", () => {
    expect(
      parseCustomSupplementInput({
        name: "Electrolytes",
        defaultDose: "1 scoop",
      }),
    ).toEqual({
      name: "Electrolytes",
      defaultDose: "1 scoop",
      iconOrType: "pill",
    });
    expect(() =>
      parseCustomSupplementInput({ name: "Electrolytes", defaultDose: "  " }),
    ).toThrow("Default dose is required.");
  });

  it("parses gram and scoop hints from a dose string", () => {
    expect(parseDoseHint("30g / 1 scoop")).toEqual({
      amountGrams: 30,
      scoops: 1,
    });
  });
});

describe("catalog merge", () => {
  it("lists custom exercises ahead of builtins", () => {
    const merged = mergeExerciseCatalog([
      {
        id: "c1",
        name: "Pendlay Row",
        muscleGroup: "BACK",
        defaultWeight: 70,
        defaultReps: 6,
        createdAt: "2026-09-11T00:00:00.000Z",
      },
    ]);
    expect(merged[0]).toMatchObject({
      id: "c1",
      name: "Pendlay Row",
      source: "custom",
    });
    expect(merged.some((item) => item.name === "Bench Press")).toBe(true);
  });

  it("lists only supplements the user added", () => {
    expect(mergeSupplementCatalog([])).toEqual([]);
    const merged = mergeSupplementCatalog([
      {
        id: "s1",
        name: "Beta Alanine",
        defaultDose: "3g",
        iconOrType: "pill",
        createdAt: "2026-09-11T00:00:00.000Z",
      },
    ]);
    expect(merged.map((item) => item.name)).toEqual(["Beta Alanine"]);
  });
});
