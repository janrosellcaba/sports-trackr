import { describe, expect, it } from "vitest";
import {
  ACCENT_STORAGE_KEY,
  ACCENT_THEME_IDS,
  ACCENT_THEMES,
  COLOR_MODE_STORAGE_KEY,
  DEFAULT_ACCENT_THEME,
  DEFAULT_COLOR_MODE,
  accentCssVars,
  applyAccentToDocument,
  applyColorModeToDocument,
  resolveAccentTheme,
  resolveColorMode,
  themeBootstrapScript,
  themeColorForMode,
} from "@/lib/theme";

describe("resolveAccentTheme", () => {
  it("returns Volt Nitro as the default fallback", () => {
    expect(resolveAccentTheme(undefined).id).toBe(DEFAULT_ACCENT_THEME);
    expect(resolveAccentTheme("not-a-theme").id).toBe("volt");
    expect(resolveAccentTheme(null).primary).toBe("#84cc16");
    expect(resolveAccentTheme("volt").name).toBe("Volt Nitro");
  });

  it("resolves every curated fitness preset without emojis", () => {
    expect(resolveAccentTheme("crimson").primary).toBe("#ef4444");
    expect(resolveAccentTheme("volt").hover).toBe("#eab308");
    expect(resolveAccentTheme("ice").primary).toBe("#06b6d4");
    expect(resolveAccentTheme("royal").primary).toBe("#8b5cf6");
    expect(ACCENT_THEME_IDS).toEqual([
      "volt",
      "amber",
      "crimson",
      "ice",
      "royal",
    ]);
    for (const id of ACCENT_THEME_IDS) {
      expect(ACCENT_THEMES[id]).not.toHaveProperty("emoji");
      expect(ACCENT_THEMES[id].name).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    }
  });
});

describe("resolveColorMode", () => {
  it("defaults to dark and accepts light", () => {
    expect(resolveColorMode(undefined)).toBe(DEFAULT_COLOR_MODE);
    expect(resolveColorMode("nope")).toBe("dark");
    expect(resolveColorMode("light")).toBe("light");
    expect(themeColorForMode("light")).toBe("#f3efe6");
    expect(themeColorForMode("dark")).toBe("#09090b");
  });
});

describe("accentCssVars", () => {
  it("injects the accent custom properties used by the UI", () => {
    const vars = accentCssVars(resolveAccentTheme("ice"));
    expect(vars["--accent-primary"]).toBe("#06b6d4");
    expect(vars["--accent-hover"]).toBe("#38bdf8");
    expect(vars["--accent-glow"]).toContain("6, 182, 212");
    expect(vars["--accent-fg"]).toBe("#09090b");
  });

  it("writes variables onto a document root and falls back for unknown ids", () => {
    const root = document.createElement("html");
    applyAccentToDocument(resolveAccentTheme("garbage"), root);
    expect(root.dataset.accent).toBe("volt");
    expect(root.style.getPropertyValue("--accent-primary")).toBe("#84cc16");
    expect(ACCENT_STORAGE_KEY).toBe("trackr-accent");
  });

  it("writes the color mode onto the document root", () => {
    const root = document.createElement("html");
    applyColorModeToDocument("light", root);
    expect(root.dataset.theme).toBe("light");
    expect(root.style.colorScheme).toBe("light");
  });

  it("prefers server accent and color mode over localStorage in the bootstrap script", () => {
    const script = themeBootstrapScript("royal", "light");
    expect(script).toContain("royal");
    expect(script).toContain("light");
    expect(script).toContain(ACCENT_STORAGE_KEY);
    expect(script).toContain(COLOR_MODE_STORAGE_KEY);
  });
});
