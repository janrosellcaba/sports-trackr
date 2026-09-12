export const ACCENT_THEME_IDS = [
  "amber",
  "crimson",
  "volt",
  "ice",
  "royal",
] as const;

export type AccentThemeId = (typeof ACCENT_THEME_IDS)[number];

export const DEFAULT_ACCENT_THEME: AccentThemeId = "amber";
export const ACCENT_STORAGE_KEY = "trackr-accent";

export type AccentTheme = {
  id: AccentThemeId;
  name: string;
  emoji: string;
  primary: string;
  hover: string;
  glow: string;
  soft: string;
  fg: string;
};

export const ACCENT_THEMES: Record<AccentThemeId, AccentTheme> = {
  amber: {
    id: "amber",
    name: "Amber Forge",
    emoji: "⚡",
    primary: "#f97316",
    hover: "#fb923c",
    glow: "rgba(249, 115, 22, 0.38)",
    soft: "rgba(249, 115, 22, 0.16)",
    fg: "#09090b",
  },
  crimson: {
    id: "crimson",
    name: "Crimson Iron",
    emoji: "🥊",
    primary: "#ef4444",
    hover: "#f87171",
    glow: "rgba(239, 68, 68, 0.38)",
    soft: "rgba(239, 68, 68, 0.16)",
    fg: "#ffffff",
  },
  volt: {
    id: "volt",
    name: "Volt Nitro",
    emoji: "⚡",
    primary: "#84cc16",
    hover: "#eab308",
    glow: "rgba(132, 204, 22, 0.38)",
    soft: "rgba(132, 204, 22, 0.16)",
    fg: "#09090b",
  },
  ice: {
    id: "ice",
    name: "Cyber Ice",
    emoji: "❄️",
    primary: "#06b6d4",
    hover: "#38bdf8",
    glow: "rgba(6, 182, 212, 0.38)",
    soft: "rgba(6, 182, 212, 0.16)",
    fg: "#09090b",
  },
  royal: {
    id: "royal",
    name: "Royal Pump",
    emoji: "🟣",
    primary: "#8b5cf6",
    hover: "#a855f7",
    glow: "rgba(139, 92, 246, 0.38)",
    soft: "rgba(168, 85, 247, 0.16)",
    fg: "#ffffff",
  },
};

export function isAccentThemeId(value: unknown): value is AccentThemeId {
  return (
    typeof value === "string" &&
    (ACCENT_THEME_IDS as readonly string[]).includes(value)
  );
}

export function resolveAccentTheme(value: unknown): AccentTheme {
  if (isAccentThemeId(value)) return ACCENT_THEMES[value];
  return ACCENT_THEMES[DEFAULT_ACCENT_THEME];
}

export function accentCssVars(theme: AccentTheme): Record<string, string> {
  return {
    "--accent-primary": theme.primary,
    "--accent-hover": theme.hover,
    "--accent-glow": theme.glow,
    "--accent-soft": theme.soft,
    "--accent-fg": theme.fg,
  };
}

export function applyAccentToDocument(
  theme: AccentTheme,
  root: Pick<HTMLElement, "dataset" | "style"> = document.documentElement,
): void {
  root.dataset.accent = theme.id;
  for (const [key, value] of Object.entries(accentCssVars(theme))) {
    root.style.setProperty(key, value);
  }
}

export function themeBootstrapScript(serverTheme?: string | null): string {
  return `(function(){try{var k=${JSON.stringify(ACCENT_STORAGE_KEY)};var ok=${JSON.stringify(ACCENT_THEME_IDS)};var s=${JSON.stringify(typeof serverTheme === "string" ? serverTheme : "")};var a=ok.indexOf(s)!==-1?s:localStorage.getItem(k);if(ok.indexOf(a)!==-1){document.documentElement.dataset.accent=a}}catch(e){}})();`;
}

export const THEME_BOOTSTRAP_SCRIPT = themeBootstrapScript();
