"use client";

import { useAccentTheme } from "@/components/theme/ThemeProvider";
import { useUnits } from "@/components/units/UnitsProvider";
import {
  ACCENT_THEMES,
  ACCENT_THEME_IDS,
  type AccentThemeId,
} from "@/lib/theme";
import { DISTANCE_UNITS, MASS_UNITS } from "@/lib/units";
import { CARD_CLS, LABEL_CLS, chipClass } from "@/lib/ui";

export function AppearanceView() {
  const { theme, setTheme, colorMode, setColorMode, saveError } = useAccentTheme();
  const {
    massUnit,
    distanceUnit,
    setMassUnit,
    setDistanceUnit,
    saveError: unitsError,
  } = useUnits();

  return (
    <div className="space-y-3">
      {saveError || unitsError ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {saveError || unitsError}
        </p>
      ) : null}

      <section className={`${CARD_CLS} space-y-3 p-4`}>
        <p className={LABEL_CLS}>Mode</p>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Color mode">
          {(["dark", "light"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={colorMode === mode}
              onClick={() => setColorMode(mode)}
              className={`${chipClass(colorMode === mode)} w-full py-3`}
            >
              {mode === "dark" ? "Dark" : "Light"}
            </button>
          ))}
        </div>
      </section>

      <section className={`${CARD_CLS} space-y-3 p-4`}>
        <p className={LABEL_CLS}>Weight</p>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Weight unit">
          {MASS_UNITS.map((unit) => (
            <button
              key={unit}
              type="button"
              aria-pressed={massUnit === unit}
              onClick={() => setMassUnit(unit)}
              className={`${chipClass(massUnit === unit)} w-full py-3`}
            >
              {unit === "kg" ? "Kilograms" : "Pounds"}
            </button>
          ))}
        </div>
      </section>

      <section className={`${CARD_CLS} space-y-3 p-4`}>
        <p className={LABEL_CLS}>Distance</p>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Distance unit">
          {DISTANCE_UNITS.map((unit) => (
            <button
              key={unit}
              type="button"
              aria-pressed={distanceUnit === unit}
              onClick={() => setDistanceUnit(unit)}
              className={`${chipClass(distanceUnit === unit)} w-full py-3`}
            >
              {unit === "km" ? "Kilometers" : "Miles"}
            </button>
          ))}
        </div>
      </section>

      <section className={`${CARD_CLS} space-y-3 p-4`}>
        <p className={LABEL_CLS}>Accent</p>
        <div className="grid grid-cols-1 gap-2" role="listbox" aria-label="Accent">
          {ACCENT_THEME_IDS.map((id) => {
            const preset = ACCENT_THEMES[id];
            const active = theme.id === id;
            return (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => setTheme(id as AccentThemeId)}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-150 ${
                  active
                    ? "border-brand bg-brand/10"
                    : "border-line bg-cream/40 hover:border-brand/40 hover:bg-chip/40 motion-safe:hover:scale-[1.01]"
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
