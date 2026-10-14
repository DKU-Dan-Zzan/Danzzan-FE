import { describe, expect, it } from "vitest";
import { createMayTheme, getDefaultThemeData, getMayThemeData, isSavedMayTheme, normalizeThemeColors } from "../defaultTheme";

describe("May built-in theme", () => {
  it("keeps the PR #103 brand palette with the shared status and map policy", () => {
    // cf71c7a src/index.css: electric-curator HOME highlight rgb(7 49 97), secondary/warning,
    // Status and category colors follow the current shared authoring policy.
    const theme = getMayThemeData();
    expect(theme.brand).toEqual({ primary: "#073161", secondary: "#f5b070", accent: "#8fa9be", strong: "#8fa9be" });
    expect(theme.status).toEqual({ success: "#2e7d32", warning: "#b26a00", danger: "#b3261e", pending: "#e3776a" });
    expect(theme.category).toEqual({ pub: "#073161", foodTruck: "#ec4899", experience: "#10b981", event: "#f6ca3b", facility: "#3b82f6", restArea: getDefaultThemeData().category.restArea });
  });

  it("returns independent palette copies", () => {
    const theme = createMayTheme(false);
    theme.themeData.brand.primary = "#123456";
    expect(getMayThemeData().brand.primary).toBe("#073161");
  });

  it("recognizes persisted copies regardless of HEX letter case", () => {
    const theme = { ...createMayTheme(true), id: 42 };
    theme.themeData.brand.accent = "#8FA9BE";
    expect(isSavedMayTheme(theme)).toBe(true);
  });

  it("keeps the previous gray-blue preset as a separate saved theme", () => {
    const previous = { ...createMayTheme(true), id: 42 };
    previous.themeData.brand.primary = "#8fa9be";
    expect(isSavedMayTheme(previous)).toBe(false);
    expect(previous.themeData.brand.primary).toBe("#8fa9be");
    expect(previous.active).toBe(true);
  });

  it("does not hide renamed, recolored, or poster-derived themes", () => {
    const theme = { ...createMayTheme(false), id: 42 };
    expect(isSavedMayTheme({ ...theme, name: "내 테마" })).toBe(false);
    expect(isSavedMayTheme({ ...theme, themeData: { ...theme.themeData, status: { ...theme.themeData.status, warning: "#123456" } } })).toBe(false);
    expect(isSavedMayTheme({ ...theme, sourcePosterUrl: "/poster.jpg" })).toBe(false);
    expect(isSavedMayTheme({ ...theme, selectedBaseColor: "#8fa9be" })).toBe(false);
    expect(isSavedMayTheme({ ...theme, sourceColors: ["#8fa9be"] })).toBe(false);
  });
});

describe("theme authoring color policy", () => {
  it("fixes semantic colors and links pub to primary without changing the source", () => {
    const source = getDefaultThemeData();
    source.brand.primary = "#3b82f6";
    source.status.success = "#000000";
    source.category.foodTruck = "#ffffff";
    const result = normalizeThemeColors(source);
    expect(result.brand).toEqual(source.brand);
    expect(result.status).toEqual({ success: "#2e7d32", warning: "#b26a00", danger: "#b3261e", pending: "#e3776a" });
    expect(result.category).toEqual({ pub: "#3b82f6", foodTruck: "#ec4899", experience: "#10b981", event: "#f6ca3b", restArea: "#8b5cf6", facility: "#3b82f6" });
    expect(source.status.success).toBe("#000000");
    expect(source.category.foodTruck).toBe("#ffffff");
    expect(normalizeThemeColors(result)).toEqual(result);
  });
});
