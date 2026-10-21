import type { ActiveThemeResponse, ThemeData } from "@/api/app/festival/activeThemeApi";
import { CURRENT_FESTIVAL_SETTING_ID } from "@/config/festivalSetting";

/** Reserved for the built-in UI choice; never sent to the persisted theme endpoints. */
export const DEFAULT_THEME_ID = 0;
export const MAY_THEME_ID = -1;
export const MAY_THEME_NAME = "Coastal Sunset";

/** PR #103 head cf71c7a: public electric-curator palette mapped to today's Theme Core. */
export function getMayThemeData(): ThemeData {
  return normalizeThemeColors({
    ...getDefaultThemeData(),
    // May's HOME highlight is preserved; semantic colors use today's fixed policy.
    brand: { primary: "#073161", secondary: "#f5b070", accent: "#8fa9be", strong: "#8fa9be" },
  });
}

export function createMayTheme(active: boolean): ActiveThemeResponse {
  return {
    id: MAY_THEME_ID, festivalSettingId: CURRENT_FESTIVAL_SETTING_ID,
    name: MAY_THEME_NAME, themeData: getMayThemeData(), active,
    createdAt: "", updatedAt: "",
  };
}

/** Recognize only an unchanged preset copy; retain edited or poster-based user themes. */
export function isSavedMayTheme(theme: ActiveThemeResponse): boolean {
  if (theme.name !== MAY_THEME_NAME || theme.sourcePosterUrl || theme.selectedBaseColor || theme.sourceColors?.length) return false;
  const preset = getMayThemeData();
  return (Object.keys(preset) as Array<keyof ThemeData>).every((group) =>
    Object.entries(preset[group]).every(([key, color]) =>
      (theme.themeData[group] as Record<string, string>)[key]?.toLowerCase() === color));
}

/** Original Theme Core colors in index.css, independent of the currently applied theme. */
export function getDefaultThemeData(): ThemeData {
  return {
    brand: { primary: "#ff642d", secondary: "#f5e3a3", accent: "#ff642d", strong: "#e13600" },
    status: { success: "#2e7d32", warning: "#b26a00", danger: "#b3261e", pending: "#e3776a" },
    category: { pub: "#ff642d", foodTruck: "#ec4899", experience: "#10b981", event: "#f6ca3b", restArea: "#8b5cf6", facility: "#3b82f6" },
  };
}

export function createDefaultTheme(active: boolean): ActiveThemeResponse {
  return {
    id: DEFAULT_THEME_ID, festivalSettingId: CURRENT_FESTIVAL_SETTING_ID,
    name: "Tangerine Cream", themeData: getDefaultThemeData(), active,
    createdAt: "", updatedAt: "",
  };
}

/** Shared authoring policy; loading a saved theme must not rewrite its palette. */
export function normalizeThemeColors(data: ThemeData): ThemeData {
  const defaults = getDefaultThemeData();
  return {
    brand: { ...data.brand },
    status: defaults.status,
    category: { ...defaults.category, pub: data.brand.primary },
  };
}
