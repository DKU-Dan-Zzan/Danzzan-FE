import type { CSSProperties } from "react";
import type { ThemeData } from "@/api/app/festival/activeThemeApi";
import { THEME_CORE_VARIABLES } from "@/lib/app/festival/activeTheme";

export type ThemeDraft = { name: string; themeData: ThemeData };

export const THEME_FIELDS = [
  { key: "brand", title: "브랜드", colors: [
    ["primary", "Primary"], ["secondary", "Secondary"],
    ["accent", "Accent"], ["strong", "Strong · 진한 브랜드 컬러"],
  ] },
  { key: "status", title: "상태", colors: [
    ["success", "Success"], ["warning", "Warning"],
    ["danger", "Danger"], ["pending", "Pending"],
  ] },
  { key: "category", title: "지도 카테고리", colors: [
    ["pub", "주점"], ["foodTruck", "푸드트럭"], ["experience", "부스"],
    ["event", "이벤트"], ["restArea", "쉼터"], ["facility", "편의시설"],
  ] },
] as const;

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export function isHexColor(value: string): boolean {
  return HEX_COLOR.test(value);
}

export function getThemeColor(data: ThemeData, group: keyof ThemeData, key: string): string {
  return (data[group] as Record<string, string>)[key];
}

export function validateThemeDraft(draft: ThemeDraft): string | null {
  if (!draft.name.trim()) return "테마 이름을 입력해 주세요.";
  if (draft.name.trim().length > 100) return "테마 이름은 100자 이하여야 합니다.";
  for (const group of THEME_FIELDS) {
    for (const [key, label] of group.colors) {
      if (!isHexColor(getThemeColor(draft.themeData, group.key, key))) {
        return `${group.title} · ${label} 색상을 #RRGGBB 형식으로 입력해 주세요.`;
      }
    }
  }
  return null;
}

export function cloneThemeData(data: ThemeData): ThemeData {
  return {
    brand: { ...data.brand },
    status: { ...data.status },
    category: { ...data.category },
  };
}

export function readBundledThemeData(root = document.documentElement): ThemeData {
  const styles = getComputedStyle(root);
  const read = (variable: string) => styles.getPropertyValue(variable).trim();
  return {
    brand: {
      primary: read(THEME_CORE_VARIABLES.brand.primary),
      secondary: read(THEME_CORE_VARIABLES.brand.secondary),
      accent: read(THEME_CORE_VARIABLES.brand.accent),
      strong: read(THEME_CORE_VARIABLES.brand.strong),
    },
    status: {
      success: read(THEME_CORE_VARIABLES.status.success),
      warning: read(THEME_CORE_VARIABLES.status.warning),
      danger: read(THEME_CORE_VARIABLES.status.danger),
      pending: read(THEME_CORE_VARIABLES.status.pending),
    },
    category: {
      pub: read(THEME_CORE_VARIABLES.category.pub),
      foodTruck: read(THEME_CORE_VARIABLES.category.foodTruck),
      experience: read(THEME_CORE_VARIABLES.category.experience),
      event: read(THEME_CORE_VARIABLES.category.event),
      restArea: read(THEME_CORE_VARIABLES.category.restArea),
      facility: read(THEME_CORE_VARIABLES.category.facility),
    },
  };
}

/** Scoped preview aliases avoid inherited, already-computed semantic variables on :root. */
export function createPreviewStyle(data: ThemeData): CSSProperties {
  const style: Record<string, string> = {};
  for (const group of THEME_FIELDS) {
    for (const [key] of group.colors) {
      style[`--preview-${group.key}-${key}`] = getThemeColor(data, group.key, key);
    }
  }
  return style as CSSProperties;
}
