import { getActiveTheme, type ThemeData } from "@/api/app/festival/activeThemeApi";
import { CURRENT_FESTIVAL_SETTING_ID } from "@/config/festivalSetting";

/** Single mapping for the 14 persisted colors; component tokens stay in CSS. */
export const THEME_CORE_VARIABLES = {
  brand: {
    primary: "--theme-brand-primary",
    secondary: "--theme-brand-secondary",
    accent: "--theme-brand-accent",
    textEmphasis: "--theme-brand-text-emphasis",
  },
  status: {
    success: "--theme-status-success",
    warning: "--theme-status-warning",
    danger: "--theme-status-danger",
    pending: "--theme-status-pending",
  },
  category: {
    pub: "--theme-category-pub",
    foodTruck: "--theme-category-food-truck",
    experience: "--theme-category-experience",
    event: "--theme-category-event",
    restArea: "--theme-category-rest-area",
    facility: "--theme-category-facility",
  },
} as const;

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** Re-callable after a future theme activation. Invalid payloads never partially replace colors. */
export function applyThemeData(themeData: ThemeData, root = document.documentElement): void {
  const colors: Array<[string, string]> = [];

  for (const group of Object.keys(THEME_CORE_VARIABLES) as Array<keyof ThemeData>) {
    const keys = THEME_CORE_VARIABLES[group];
    for (const key of Object.keys(keys)) {
      const value = themeData?.[group]?.[key as keyof typeof themeData[typeof group]];
      if (typeof value !== "string" || !HEX_COLOR.test(value)) {
        throw new Error(`Invalid active Theme color: ${group}.${key}`);
      }
      colors.push([keys[key as keyof typeof keys], value]);
    }
  }

  for (const [variable, value] of colors) root.style.setProperty(variable, value);
}

/** Run before React mounts so every route, including ticketing and admin, shares the same colors. */
export async function loadActiveFestivalTheme(): Promise<void> {
  try {
    const activeTheme = await getActiveTheme(CURRENT_FESTIVAL_SETTING_ID);
    if (activeTheme) applyThemeData(activeTheme.themeData);
  } catch (error) {
    console.warn("Active festival theme unavailable; using bundled colors.", error);
  }
}
