import { LOCALE_LABELS, parseAppLocale, type AppLocale } from "@/lib/locale";
import { starterExercises, starterMuscles } from "@/lib/starter-catalog";

export type OnboardingStepId =
  | "language"
  | "welcome"
  | "home"
  | "log"
  | "analytics"
  | "done";

export const ONBOARDING_STEPS: OnboardingStepId[] = [
  "language",
  "welcome",
  "home",
  "log",
  "analytics",
  "done",
];

type TourCopy = {
  languageTitle: string;
  languageBody: string;
  welcomeTitle: string;
  welcomeBody: string;
  homeTitle: string;
  homeBody: string;
  logTitle: string;
  logBody: string;
  analyticsTitle: string;
  analyticsBody: string;
  doneTitle: string;
  doneBody: string;
  musclesLabel: string;
  exercisesLabel: string;
  back: string;
  next: string;
  skip: string;
  finish: string;
  close: string;
  replay: string;
  replayHint: string;
};

const COPY: Record<AppLocale, TourCopy> = {
  en: {
    languageTitle: "Language",
    languageBody: "Tour copy and the starter catalog use this language. You can change it later by opening the tour again.",
    welcomeTitle: "Trackr",
    welcomeBody: "A simple log for gym, sport, supplements, and body weight. A short starter catalog is ready so you can tap on day one.",
    homeTitle: "Home",
    homeBody: "Home is today. Tap muscles for gym, log sports and supplements, and save weight. Settings still uses these English screen names.",
    logTitle: "Log",
    logBody: "Log is the history. Filter gym, sport, or supplements. Nothing here changes how you train — it only stores what you tap.",
    analyticsTitle: "Analytics",
    analyticsBody: "Analytics shows activity, load, shape, body weight, and PRs. Copy a JSON snapshot or an AI brief for a coach if you want.",
    doneTitle: "You're set",
    doneBody: "Open the tour anytime from Settings. Add or edit muscles and exercises there whenever the starter set is not enough.",
    musclesLabel: "Starter muscles",
    exercisesLabel: "Starter lifts",
    back: "Back",
    next: "Next",
    skip: "Skip",
    finish: "Start logging",
    close: "Close",
    replay: "App tour",
    replayHint: "Language and walkthrough",
  },
  es: {
    languageTitle: "Idioma",
    languageBody: "El tour y el catálogo inicial usan este idioma. Puedes cambiarlo más tarde abriendo el tour otra vez.",
    welcomeTitle: "Trackr",
    welcomeBody: "Un registro simple para gym, deporte, suplementos y peso. Hay un catálogo corto listo para el primer día.",
    homeTitle: "Home",
    homeBody: "Home es el día de hoy. Toca músculos para el gym, apunta deporte y suplementos, y guarda el peso. Los nombres de las pantallas (Home, Log, Analytics, Settings) siguen en inglés.",
    logTitle: "Log",
    logBody: "Log es el historial. Filtra gym, deporte o suplementos. No cambia cómo entrenas: solo guarda lo que tocas.",
    analyticsTitle: "Analytics",
    analyticsBody: "Analytics muestra actividad, carga, forma, peso y PRs. Copia un JSON o un brief de IA para un entrenador si quieres.",
    doneTitle: "Listo",
    doneBody: "Abre el tour cuando quieras desde Settings. Añade o edita músculos y ejercicios allí si el set inicial se queda corto.",
    musclesLabel: "Músculos iniciales",
    exercisesLabel: "Ejercicios iniciales",
    back: "Atrás",
    next: "Siguiente",
    skip: "Saltar",
    finish: "Empezar",
    close: "Cerrar",
    replay: "Tour de la app",
    replayHint: "Idioma y guía",
  },
  ca: {
    languageTitle: "Idioma",
    languageBody: "El tour i el catàleg inicial fan servir aquest idioma. El pots canviar més tard tornant a obrir el tour.",
    welcomeTitle: "Trackr",
    welcomeBody: "Un registre simple per a gimnàs, esport, suplements i pes. Hi ha un catàleg curt a punt per al primer dia.",
    homeTitle: "Home",
    homeBody: "Home és el dia d'avui. Toca músculs per al gimnàs, apunta esport i suplements, i desa el pes. Els noms de les pantalles (Home, Log, Analytics, Settings) continuen en anglès.",
    logTitle: "Log",
    logBody: "Log és l'historial. Filtra gimnàs, esport o suplements. No canvia com entrenes: només desa el que toques.",
    analyticsTitle: "Analytics",
    analyticsBody: "Analytics mostra activitat, càrrega, forma, pes i PRs. Copia un JSON o un brief d'IA per a un entrenador si vols.",
    doneTitle: "Ja està",
    doneBody: "Obre el tour quan vulguis des de Settings. Afegeix o edita músculs i exercicis allà si el set inicial es queda curt.",
    musclesLabel: "Músculs inicials",
    exercisesLabel: "Exercicis inicials",
    back: "Enrere",
    next: "Següent",
    skip: "Salta",
    finish: "Comença",
    close: "Tanca",
    replay: "Tour de l'app",
    replayHint: "Idioma i guia",
  },
};

export function onboardingCopy(locale: unknown): TourCopy {
  return COPY[parseAppLocale(locale)];
}

export function onboardingStepIndex(id: OnboardingStepId): number {
  return ONBOARDING_STEPS.indexOf(id);
}

export function nextOnboardingStep(id: OnboardingStepId): OnboardingStepId | null {
  const index = onboardingStepIndex(id);
  return ONBOARDING_STEPS[index + 1] ?? null;
}

export function previousOnboardingStep(id: OnboardingStepId): OnboardingStepId | null {
  const index = onboardingStepIndex(id);
  return index > 0 ? ONBOARDING_STEPS[index - 1] ?? null : null;
}

export function starterCatalogPreview(locale: unknown): {
  muscles: string[];
  exercises: string[];
} {
  return {
    muscles: starterMuscles(locale).map((item) => item.name),
    exercises: starterExercises(locale).map((item) => item.name),
  };
}

export { LOCALE_LABELS };
