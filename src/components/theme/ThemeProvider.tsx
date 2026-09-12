"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { updateAccentTheme } from "@/app/actions/account";
import {
  ACCENT_STORAGE_KEY,
  ACCENT_THEMES,
  DEFAULT_ACCENT_THEME,
  applyAccentToDocument,
  resolveAccentTheme,
  type AccentTheme,
  type AccentThemeId,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: AccentTheme;
  setTheme: (id: AccentThemeId, persist?: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyAccent(id: AccentThemeId) {
  applyAccentToDocument(resolveAccentTheme(id));
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: string | null;
}) {
  const [themeId, setThemeId] = useState<AccentThemeId>(
    resolveAccentTheme(initialTheme).id,
  );

  useEffect(() => {
    const resolved = initialTheme
      ? resolveAccentTheme(initialTheme)
      : resolveAccentTheme(localStorage.getItem(ACCENT_STORAGE_KEY));
    setThemeId(resolved.id);
    applyAccent(resolved.id);
    localStorage.setItem(ACCENT_STORAGE_KEY, resolved.id);
  }, [initialTheme]);

  const setTheme = useCallback((id: AccentThemeId, persist = true) => {
    const resolved = resolveAccentTheme(id);
    setThemeId(resolved.id);
    applyAccent(resolved.id);
    localStorage.setItem(ACCENT_STORAGE_KEY, resolved.id);
    if (persist) {
      void updateAccentTheme(resolved.id).catch(() => undefined);
    }
  }, []);

  const value = useMemo(
    () => ({ theme: ACCENT_THEMES[themeId] ?? ACCENT_THEMES[DEFAULT_ACCENT_THEME], setTheme }),
    [setTheme, themeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAccentTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: ACCENT_THEMES[DEFAULT_ACCENT_THEME],
      setTheme: () => undefined,
    };
  }
  return ctx;
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
