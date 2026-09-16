export const ACCENT_THEME_IDS = [
  "volt",
  "amber",
  "crimson",
  "ice",
  "royal",
] as const;

export type AccentThemeId = (typeof ACCENT_THEME_IDS)[number];

export const DEFAULT_ACCENT_THEME: AccentThemeId = "volt";
export const ACCENT_STORAGE_KEY = "trackr-accent";

export const COLOR_MODES = ["dark", "light"] as const;
export type ColorMode = (typeof COLOR_MODES)[number];

export const DEFAULT_COLOR_MODE: ColorMode = "dark";
export const COLOR_MODE_STORAGE_KEY = "trackr-color-mode";

export const DARK_THEME_COLOR = "#09090b";
export const LIGHT_THEME_COLOR = "#f3efe6";

export type AccentTheme = {
  id: AccentThemeId;
  name: string;
  primary: string;
  hover: string;
  glow: string;
  soft: string;
  fg: string;
};

export const ACCENT_THEMES: Record<AccentThemeId, AccentTheme> = {
  volt: {
    id: "volt",
    name: "Volt Nitro",
    primary: "#84cc16",
    hover: "#eab308",
    glow: "rgba(132, 204, 22, 0.38)",
    soft: "rgba(132, 204, 22, 0.16)",
    fg: "#09090b",
  },
  amber: {
    id: "amber",
    name: "Amber Forge",
    primary: "#f97316",
    hover: "#fb923c",
    glow: "rgba(249, 115, 22, 0.38)",
    soft: "rgba(249, 115, 22, 0.16)",
    fg: "#09090b",
  },
  crimson: {
    id: "crimson",
    name: "Crimson Iron",
    primary: "#ef4444",
    hover: "#f87171",
    glow: "rgba(239, 68, 68, 0.38)",
    soft: "rgba(239, 68, 68, 0.16)",
    fg: "#ffffff",
  },
  ice: {
    id: "ice",
    name: "Cyber Ice",
    primary: "#06b6d4",
    hover: "#38bdf8",
    glow: "rgba(6, 182, 212, 0.38)",
    soft: "rgba(6, 182, 212, 0.16)",
    fg: "#09090b",
  },
  royal: {
    id: "royal",
    name: "Royal Pump",
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

export function isColorMode(value: unknown): value is ColorMode {
  return (
    typeof value === "string" &&
    (COLOR_MODES as readonly string[]).includes(value)
  );
}

export function resolveColorMode(value: unknown): ColorMode {
  return isColorMode(value) ? value : DEFAULT_COLOR_MODE;
}

export function themeColorForMode(mode: ColorMode): string {
  return mode === "light" ? LIGHT_THEME_COLOR : DARK_THEME_COLOR;
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

export function applyColorModeToDocument(
  mode: ColorMode,
  root: Pick<HTMLElement, "dataset" | "style"> = document.documentElement,
): void {
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
}

export function applyThemeColorMeta(mode: ColorMode): void {
  if (typeof document === "undefined") return;
  const color = themeColorForMode(mode);
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((node) => node.setAttribute("content", color));
  let status = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!status) {
    status = document.createElement("meta");
    status.setAttribute("name", "apple-mobile-web-app-status-bar-style");
    document.head.appendChild(status);
  }
  status.setAttribute(
    "content",
    mode === "light" ? "default" : "black-translucent",
  );
}

export function themeBootstrapScript(
  serverTheme?: string | null,
  serverColorMode?: string | null,
): string {
  return `(function(){try{var ak=${JSON.stringify(ACCENT_STORAGE_KEY)};var mk=${JSON.stringify(COLOR_MODE_STORAGE_KEY)};var accents=${JSON.stringify(ACCENT_THEME_IDS)};var modes=${JSON.stringify(COLOR_MODES)};var s=${JSON.stringify(typeof serverTheme === "string" ? serverTheme : "")};var c=${JSON.stringify(typeof serverColorMode === "string" ? serverColorMode : "")};var a=accents.indexOf(s)!==-1?s:localStorage.getItem(ak);var m=modes.indexOf(c)!==-1?c:localStorage.getItem(mk);var root=document.documentElement;if(accents.indexOf(a)!==-1)root.dataset.accent=a;if(modes.indexOf(m)!==-1){root.dataset.theme=m;root.style.colorScheme=m}}catch(e){}})();`;
}
