// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { contrastRatio, createAdminThemeActionStyle, readActiveThemeStrong } from "@/routes/admin/adminThemeActionColors";

function actionColors(strong: string) {
  return createAdminThemeActionStyle(strong) as Record<string, string>;
}

describe("admin theme action colors", () => {
  it.each(["#7546b7", "#3274d9", "#eee5fb"]) ("keeps %s in the active brand family with readable button and outline colors", (strong) => {
    const colors = actionColors(strong);
    expect(contrastRatio(colors["--admin-theme-action-bg"], colors["--admin-theme-action-fg"])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors["--admin-theme-action-outline"], "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors["--admin-theme-action-bg"], "#ffffff")).toBeGreaterThanOrEqual(3);
    expect(colors["--admin-theme-action-bg"]).not.toBe("#e13600");
    expect(colors["--admin-theme-action-hover"]).not.toBe("#fff7ed");
  });

  it("darkens a pastel strong color instead of making the button look disabled", () => {
    const colors = actionColors("#eee5fb");
    expect(colors["--admin-theme-action-bg"]).not.toBe("#eee5fb");
    expect(contrastRatio(colors["--admin-theme-action-bg"], "#ffffff")).toBeGreaterThanOrEqual(3);
  });

  it("reads the applied root Theme Core and falls back to the bundled strong color", () => {
    const root = document.documentElement;
    root.style.setProperty("--theme-brand-strong", "#7546b7");
    expect(readActiveThemeStrong()).toBe("#7546b7");
    root.style.removeProperty("--theme-brand-strong");
    expect(readActiveThemeStrong()).toBe("#e13600");
  });
});
