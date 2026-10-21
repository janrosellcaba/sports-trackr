export const SETTINGS_SECTIONS = [
  "muscles",
  "sports",
  "exercises",
  "appearance",
  "data",
  "account",
  "support",
] as const;

export type SettingsSection = "menu" | (typeof SETTINGS_SECTIONS)[number];
