export const SETTINGS_SECTIONS = [
  "muscles",
  "exercises",
  "supplements",
  "appearance",
  "data",
  "account",
] as const;

export type SettingsSection = "menu" | (typeof SETTINGS_SECTIONS)[number];
