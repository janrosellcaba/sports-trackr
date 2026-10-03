import { describe, expect, it } from "vitest";
import { parseAppLocale, isAppLocale, LOCALES } from "@/lib/locale";
import {
  ONBOARDING_STEPS,
  nextOnboardingStep,
  onboardingCopy,
  previousOnboardingStep,
  starterCatalogPreview,
} from "@/lib/onboarding";
import {
  DEFAULT_MUSCLES,
  starterExercises,
  starterMuscles,
} from "@/lib/starter-catalog";

describe("parseAppLocale", () => {
  it("accepts en, es, and ca", () => {
    expect(LOCALES).toEqual(["en", "es", "ca"]);
    expect(isAppLocale("ca")).toBe(true);
    expect(parseAppLocale("es")).toBe("es");
  });

  it("falls back to English", () => {
    expect(parseAppLocale("fr")).toBe("en");
    expect(parseAppLocale(null)).toBe("en");
  });
});

describe("starter catalog", () => {
  it("keeps a short popular muscle and lift set", () => {
    expect(DEFAULT_MUSCLES).toEqual([
      "Chest",
      "Shoulders",
      "Triceps",
      "Back",
      "Biceps",
      "Core",
      "Quads",
      "Hamstrings",
      "Glutes",
      "Calves",
    ]);
    expect(starterMuscles("en")).toHaveLength(10);
    expect(starterExercises("en")).toHaveLength(7);
    expect(starterExercises("en").map((item) => item.name)).toEqual([
      "Bench Press",
      "Overhead Press",
      "Pull-Up",
      "Squat",
      "Deadlift",
      "Bicep Curl",
      "Plank",
    ]);
  });

  it("translates names for Spanish and Catalan without changing keys", () => {
    expect(starterMuscles("es").map((item) => item.key)).toEqual(
      starterMuscles("en").map((item) => item.key),
    );
    expect(starterMuscles("es").map((item) => item.name)).toContain("Pecho");
    expect(starterMuscles("ca").map((item) => item.name)).toContain("Pit");
    expect(starterExercises("es").map((item) => item.name)).toContain("Sentadilla");
    expect(starterExercises("ca").map((item) => item.name)).toContain("Gatzoneta");
    expect(starterExercises("es").find((item) => item.key === "plank")?.muscleKey).toBe(
      "core",
    );
  });

  it("keeps unique display names in every locale", () => {
    for (const locale of LOCALES) {
      const muscles = starterMuscles(locale).map((item) => item.name.toLowerCase());
      const exercises = starterExercises(locale).map((item) => item.name.toLowerCase());
      expect(new Set(muscles).size).toBe(muscles.length);
      expect(new Set(exercises).size).toBe(exercises.length);
    }
  });
});

describe("onboarding copy", () => {
  it("covers every step in English, Spanish, and Catalan", () => {
    expect(ONBOARDING_STEPS).toEqual([
      "language",
      "welcome",
      "home",
      "log",
      "analytics",
      "done",
    ]);
    expect(nextOnboardingStep("language")).toBe("welcome");
    expect(previousOnboardingStep("welcome")).toBe("language");
    expect(nextOnboardingStep("done")).toBeNull();
    expect(previousOnboardingStep("language")).toBeNull();

    for (const locale of LOCALES) {
      const copy = onboardingCopy(locale);
      expect(copy.languageTitle.length).toBeGreaterThan(2);
      expect(copy.welcomeBody.length).toBeGreaterThan(10);
      expect(copy.homeTitle).toBe("Home");
      expect(copy.logTitle).toBe("Log");
      expect(copy.analyticsTitle).toBe("Analytics");
      expect(copy.replay.length).toBeGreaterThan(2);
      expect(starterCatalogPreview(locale).muscles).toHaveLength(10);
      expect(starterCatalogPreview(locale).exercises).toHaveLength(7);
    }

    expect(onboardingCopy("es").finish).toBe("Empezar");
    expect(onboardingCopy("ca").skip).toBe("Salta");
  });
});
