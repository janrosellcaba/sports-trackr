export const LOCALES = ["en", "es", "ca"] as const;

export type AppLocale = (typeof LOCALES)[number];

export function isAppLocale(value: unknown): value is AppLocale {
  return value === "en" || value === "es" || value === "ca";
}

export function parseAppLocale(value: unknown): AppLocale {
  return isAppLocale(value) ? value : "en";
}

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  es: "Español",
  ca: "Català",
};
