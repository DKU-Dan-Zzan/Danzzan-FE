// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { http } from "@/lib/http";
import { CURRENT_FESTIVAL_SETTING_ID } from "@/config/festivalSetting";
import {
  applyThemeData,
  loadActiveFestivalTheme,
  THEME_CORE_VARIABLES,
} from "@/lib/app/festival/activeTheme";
import { getDefaultThemeData } from "@/lib/app/festival/defaultTheme";
import { readBundledThemeData } from "@/routes/admin/themeEditor";
import type { ThemeData } from "@/api/app/festival/activeThemeApi";

const testTheme: ThemeData = {
  brand: {
    primary: "#123456",
    secondary: "#234567",
    accent: "#345678",
    strong: "#456789",
  },
  status: {
    success: "#56789A",
    warning: "#6789AB",
    danger: "#789ABC",
    pending: "#89ABCD",
  },
  category: {
    pub: "#9ABCDE",
    foodTruck: "#ABCDEF",
    experience: "#BCDEF0",
    event: "#CDEF01",
    restArea: "#DEF012",
    facility: "#EF0123",
  },
};

const allVariables = Object.values(THEME_CORE_VARIABLES).flatMap((group) => Object.values(group));

afterEach(() => {
  vi.restoreAllMocks();
  for (const variable of allVariables) document.documentElement.style.removeProperty(variable);
});

describe("active festival Theme", () => {
  it("keeps the selectable default equal to all 14 original CSS colors, independent of active overrides", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../../../../index.css"), "utf8");
    applyThemeData(testTheme);
    const defaults = readBundledThemeData();
    for (const group of Object.keys(THEME_CORE_VARIABLES) as Array<keyof ThemeData>) {
      for (const [key, variable] of Object.entries(THEME_CORE_VARIABLES[group])) {
        const cssValue = css.match(new RegExp(`${variable}:\\s*(#[a-fA-F0-9]{6});`))?.[1];
        expect((defaults[group] as Record<string, string>)[key]).toBe(cssValue);
      }
    }
    defaults.brand.primary = "#000000";
    expect(getDefaultThemeData().brand.primary).toBe("#ff642d");
  });

  it("maps all 14 Theme colors onto :root", () => {
    applyThemeData(testTheme);

    expect(allVariables).toHaveLength(14);
    for (const group of Object.keys(THEME_CORE_VARIABLES) as Array<keyof ThemeData>) {
      const variables = THEME_CORE_VARIABLES[group];
      for (const key of Object.keys(variables)) {
        const variable = variables[key as keyof typeof variables];
        expect(document.documentElement.style.getPropertyValue(variable)).toBe(
          testTheme[group][key as keyof typeof testTheme[typeof group]],
        );
      }
    }
  });

  it("applies an active 200 response using the current festival setting ID", async () => {
    const get = vi.spyOn(http, "get").mockResolvedValue({
      status: 200,
      data: { id: 42, festivalSettingId: CURRENT_FESTIVAL_SETTING_ID, name: "Test", themeData: testTheme },
    });

    await loadActiveFestivalTheme();

    expect(get).toHaveBeenCalledWith(
      `/festival/${CURRENT_FESTIVAL_SETTING_ID}/themes/active`,
      { timeout: 5000 },
    );
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#123456");
    expect(document.documentElement.style.getPropertyValue("--theme-brand-strong")).toBe("#456789");
    expect(document.documentElement.style.getPropertyValue("--theme-category-facility")).toBe("#EF0123");
  });

  it("restores bundled defaults on 204 even after a custom theme was applied", async () => {
    applyThemeData(testTheme);
    document.documentElement.style.setProperty("--unrelated-token", "keep");
    vi.spyOn(http, "get").mockResolvedValue({ status: 204, data: "" });

    await loadActiveFestivalTheme();

    for (const variable of allVariables) expect(document.documentElement.style.getPropertyValue(variable)).toBe("");
    expect(document.documentElement.style.getPropertyValue("--unrelated-token")).toBe("keep");
    document.documentElement.style.removeProperty("--unrelated-token");
  });

  it("keeps existing colors on request failure", async () => {
    document.documentElement.style.setProperty("--theme-brand-primary", "#ff642d");
    vi.spyOn(http, "get").mockRejectedValue(new Error("network unavailable"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await loadActiveFestivalTheme();

    expect(warn).toHaveBeenCalledOnce();
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
  });

  it("rejects malformed payloads without partially applying a theme", () => {
    const malformed = structuredClone(testTheme);
    malformed.category.facility = "not-a-color";

    expect(() => applyThemeData(malformed)).toThrow("category.facility");
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("");
  });

  it("keeps the semantic and map category bridge pointed at Theme Core", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../../../../index.css"), "utf8");
    expect(css).toContain("--semantic-primary: var(--theme-brand-primary);");
    expect(css).toContain("--semantic-text-emphasis: var(--theme-brand-strong);");
    expect(css).toContain("--primary: var(--semantic-primary);");
    expect(css).toContain("--semantic-category-pub: var(--theme-category-pub);");
    expect(css).toContain("--boothmap-marker-pub: var(--semantic-category-pub);");
  });
});
