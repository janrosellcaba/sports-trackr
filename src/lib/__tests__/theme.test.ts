import { describe, expect, it } from "vitest";
import {
  ACCENT_STORAGE_KEY,
  ACCENT_THEME_IDS,
  DEFAULT_ACCENT_THEME,
  accentCssVars,
  applyAccentToDocument,
  resolveAccentTheme,
  themeBootstrapScript,
} from "@/lib/theme";

describe("resolveAccentTheme", () => {
  it("returns Amber Forge as the default fallback", () => {
    expect(resolveAccentTheme(undefined).id).toBe(DEFAULT_ACCENT_THEME);
    expect(resolveAccentTheme("not-a-theme").id).toBe("amber");
    expect(resolveAccentTheme(null).primary).toBe("#f97316");
  });

  it("resolves every curated fitness preset", () => {
    expect(resolveAccentTheme("crimson").primary).toBe("#ef4444");
    expect(resolveAccentTheme("volt").hover).toBe("#eab308");
    expect(resolveAccentTheme("ice").primary).toBe("#06b6d4");
    expect(resolveAccentTheme("royal").primary).toBe("#8b5cf6");
    expect(ACCENT_THEME_IDS).toEqual([
      "amber",
      "crimson",
      "volt",
      "ice",
      "royal",
    ]);
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
    expect(root.dataset.accent).toBe("amber");
    expect(root.style.getPropertyValue("--accent-primary")).toBe("#f97316");
    expect(ACCENT_STORAGE_KEY).toBe("trackr-accent");
  });

  it("prefers a server theme over localStorage in the bootstrap script", () => {
    const script = themeBootstrapScript("royal");
    expect(script).toContain("royal");
    expect(script).toContain(ACCENT_STORAGE_KEY);
  });
});
