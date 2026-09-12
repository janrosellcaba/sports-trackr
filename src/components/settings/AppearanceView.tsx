"use client";

import { useAccentTheme } from "@/components/theme/ThemeProvider";
import {
  ACCENT_THEMES,
  ACCENT_THEME_IDS,
  type AccentThemeId,
} from "@/lib/theme";
import { CARD_CLS, LABEL_CLS, chipClass } from "@/lib/ui";

export function AppearanceView() {
  const { theme, setTheme, colorMode, setColorMode } = useAccentTheme();

  return (
    <div className="space-y-5">
      <section className={`${CARD_CLS} space-y-3 p-4`}>
        <p className={LABEL_CLS}>Mode</p>
        <div className="grid grid-cols-2 gap-2">
          {(["dark", "light"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setColorMode(mode)}
              className={`${chipClass(colorMode === mode)} w-full py-3`}
            >
              {mode === "dark" ? "Dark" : "Light"}
            </button>
          ))}
        </div>
      </section>

      <section className={`${CARD_CLS} space-y-3 p-4`}>
        <p className={LABEL_CLS}>Accent</p>
        <p className="text-sm text-muted">
          Accent colors update buttons, dock, badges, and charts instantly.
        </p>
        <div className="grid grid-cols-1 gap-2">
          {ACCENT_THEME_IDS.map((id) => {
            const preset = ACCENT_THEMES[id];
            const active = theme.id === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id as AccentThemeId)}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                  active
                    ? "border-brand bg-brand/10"
                    : "border-line bg-cream/40 hover:border-brand/40"
                }`}
              >
                <span
                  className="h-8 w-8 rounded-full border border-line"
                  style={{
                    background: preset.primary,
                    boxShadow: `0 0 16px ${preset.glow}`,
                  }}
                />
                <span>
                  <span className="block text-sm font-bold text-ink">
                    {preset.name}
                  </span>
                  <span className="font-mono text-[11px] text-muted">
                    {preset.primary}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
