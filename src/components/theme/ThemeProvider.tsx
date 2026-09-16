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
  saveError: string | null;
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
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    applyAppearance(themeId, colorMode);
    localStorage.setItem(ACCENT_STORAGE_KEY, themeId);
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, colorMode);
  }, [colorMode, themeId]);

  const setTheme = useCallback(
    (id: AccentThemeId, persist = true) => {
      const resolved = resolveAccentTheme(id);
      setThemeId(resolved.id);
      applyAccentToDocument(resolved);
      localStorage.setItem(ACCENT_STORAGE_KEY, resolved.id);
      if (persist) {
        void updateAccentTheme(resolved.id).then(
          () => setSaveError(null),
          (error: unknown) =>
            setSaveError(
              error instanceof Error ? error.message : "Could not save accent.",
            ),
        );
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
      void updateColorMode(resolved).then(
        () => setSaveError(null),
        (error: unknown) =>
          setSaveError(
            error instanceof Error ? error.message : "Could not save color mode.",
          ),
      );
    }
  }, []);

  const value = useMemo(
    () => ({
      theme: ACCENT_THEMES[themeId] ?? ACCENT_THEMES[DEFAULT_ACCENT_THEME],
      setTheme,
      colorMode,
      setColorMode,
      saveError,
    }),
    [colorMode, saveError, setColorMode, setTheme, themeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

const FALLBACK_THEME: ThemeContextValue = {
  theme: ACCENT_THEMES[DEFAULT_ACCENT_THEME],
  setTheme: () => undefined,
  colorMode: DEFAULT_COLOR_MODE,
  setColorMode: () => undefined,
  saveError: null,
};

export function useAccentTheme(): ThemeContextValue {
  return useContext(ThemeContext) ?? FALLBACK_THEME;
}

export function useAccentColor(): string {
  const { theme } = useAccentTheme();
  return theme.primary;
}

const LIGHT_SURFACE = {
  ink: "#18181b",
  muted: "#5c5c66",
  line: "rgba(24, 24, 27, 0.1)",
  paper: "#fffcf7",
};

const DARK_SURFACE = {
  ink: "#f4f4f5",
  muted: "#a1a1aa",
  line: "rgba(255, 255, 255, 0.08)",
  paper: "#18181b",
};

export function useSurfaceColors() {
  const { colorMode } = useAccentTheme();
  return colorMode === "light" ? LIGHT_SURFACE : DARK_SURFACE;
}
