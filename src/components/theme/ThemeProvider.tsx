"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { updateAccentTheme, updateColorMode } from "@/app/actions/account";
import {
  ACCENT_STORAGE_KEY,
  ACCENT_THEMES,
  COLOR_MODE_STORAGE_KEY,
  DEFAULT_ACCENT_THEME,
  DEFAULT_COLOR_MODE,
  applyAccentToDocument,
  applyColorModeToDocument,
  applyThemeColorMeta,
  resolveAccentTheme,
  resolveColorMode,
  type AccentTheme,
  type AccentThemeId,
  type ColorMode,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: AccentTheme;
  setTheme: (id: AccentThemeId, persist?: boolean) => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode, persist?: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyAppearance(id: AccentThemeId, mode: ColorMode) {
  applyAccentToDocument(resolveAccentTheme(id));
  applyColorModeToDocument(mode);
  applyThemeColorMeta(mode);
}

export function ThemeProvider({
  children,
  initialTheme,
  initialColorMode,
}: {
  children: React.ReactNode;
  initialTheme?: string | null;
  initialColorMode?: string | null;
}) {
  const [themeId, setThemeId] = useState<AccentThemeId>(
    resolveAccentTheme(initialTheme).id,
  );
  const [colorMode, setColorModeState] = useState<ColorMode>(
    resolveColorMode(initialColorMode),
  );

  useEffect(() => {
    const resolvedTheme = initialTheme
      ? resolveAccentTheme(initialTheme)
      : resolveAccentTheme(localStorage.getItem(ACCENT_STORAGE_KEY));
    const resolvedMode = initialColorMode
      ? resolveColorMode(initialColorMode)
      : resolveColorMode(localStorage.getItem(COLOR_MODE_STORAGE_KEY));
    setThemeId(resolvedTheme.id);
    setColorModeState(resolvedMode);
    applyAppearance(resolvedTheme.id, resolvedMode);
    localStorage.setItem(ACCENT_STORAGE_KEY, resolvedTheme.id);
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, resolvedMode);
  }, [initialColorMode, initialTheme]);

  const setTheme = useCallback(
    (id: AccentThemeId, persist = true) => {
      const resolved = resolveAccentTheme(id);
      setThemeId(resolved.id);
      applyAccentToDocument(resolved);
      localStorage.setItem(ACCENT_STORAGE_KEY, resolved.id);
      if (persist) {
        void updateAccentTheme(resolved.id).catch(() => undefined);
      }
    },
    [],
  );

  const setColorMode = useCallback((mode: ColorMode, persist = true) => {
    const resolved = resolveColorMode(mode);
    setColorModeState(resolved);
    applyColorModeToDocument(resolved);
    applyThemeColorMeta(resolved);
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, resolved);
    if (persist) {
      void updateColorMode(resolved).catch(() => undefined);
    }
  }, []);

  const value = useMemo(
    () => ({
      theme: ACCENT_THEMES[themeId] ?? ACCENT_THEMES[DEFAULT_ACCENT_THEME],
      setTheme,
      colorMode,
      setColorMode,
    }),
    [colorMode, setColorMode, setTheme, themeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

const FALLBACK_THEME: ThemeContextValue = {
  theme: ACCENT_THEMES[DEFAULT_ACCENT_THEME],
  setTheme: () => undefined,
  colorMode: DEFAULT_COLOR_MODE,
  setColorMode: () => undefined,
};

export function useAccentTheme(): ThemeContextValue {
  return useContext(ThemeContext) ?? FALLBACK_THEME;
}

export function useAccentColor(): string {
  const { theme } = useAccentTheme();
  const [color, setColor] = useState(theme.primary);

  useEffect(() => {
    const computed = getComputedStyle(document.documentElement)
      .getPropertyValue("--accent-primary")
      .trim();
    setColor(computed || theme.primary);
  }, [theme.primary]);

  return color;
}

export function useSurfaceColors() {
  const { colorMode } = useAccentTheme();
  const [colors, setColors] = useState({
    ink: "#f4f4f5",
    muted: "#a1a1aa",
    line: "rgba(255, 255, 255, 0.08)",
    paper: "#18181b",
  });

  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) =>
      root.getPropertyValue(name).trim() || fallback;
    setColors({
      ink: read("--color-ink", "#f4f4f5"),
      muted: read("--color-muted", "#a1a1aa"),
      line: read("--color-line", "rgba(255, 255, 255, 0.08)"),
      paper: read("--color-paper", "#18181b"),
    });
  }, [colorMode]);

  return colors;
}
