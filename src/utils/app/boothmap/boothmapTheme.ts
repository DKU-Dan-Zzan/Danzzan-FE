// 역할: 부스맵 카테고리별 색상/아이콘 테마 매핑 유틸을 제공한다.

import type { BoothSubType } from "@/types/app/boothmap/boothmap.types";

export type BoothmapMarkerType = "PUB" | "FOOD_TRUCK" | "EXPERIENCE" | "EVENT" | "FACILITY";
export type BoothmapZoneType = "PUB" | "FOOD_TRUCK";
export type BoothmapLabelKind = "booth" | "college";

type BoothmapColorConfig = {
  cssVar: string;
  fallback: string;
};

const BOOTHMAP_COLOR_CONFIG = {
  markerPub: { cssVar: "--boothmap-marker-pub", fallback: "#0a559c" },
  markerFoodTruck: { cssVar: "--boothmap-marker-food-truck", fallback: "#ef4444" },
  markerExperience: { cssVar: "--boothmap-marker-experience", fallback: "#10b981" },
  markerEvent: { cssVar: "--boothmap-marker-event", fallback: "#f6ca3b" },
  markerFacility: { cssVar: "--boothmap-marker-facility", fallback: "#3b82f6" },
  selectedShadow: { cssVar: "--boothmap-selected-shadow", fallback: "rgba(10, 85, 156, 0.28)" },
  selectedShadowSoft: {
    cssVar: "--boothmap-selected-shadow-soft",
    fallback: "rgba(10, 85, 156, 0.25)",
  },
  selectedRing: { cssVar: "--boothmap-selected-ring", fallback: "rgba(10, 85, 156, 0.18)" },
  collegeAccent: { cssVar: "--boothmap-college-accent", fallback: "#2563eb" },
  collegeStrokeDefault: { cssVar: "--boothmap-college-stroke-default", fallback: "#1e40af" },
  collegeStrokeSelected: { cssVar: "--boothmap-college-stroke-selected", fallback: "#1d4ed8" },
  collegeFillDefault: { cssVar: "--boothmap-college-fill-default", fallback: "#eff6ff" },
  collegeFillSelected: { cssVar: "--boothmap-college-fill-selected", fallback: "#dbeafe" },
  zonePubStroke: { cssVar: "--boothmap-zone-pub-stroke", fallback: "#1d4ed8" },
  zonePubFill: { cssVar: "--boothmap-zone-pub-fill", fallback: "#93c5fd" },
  zonePubDot: { cssVar: "--boothmap-zone-pub-dot", fallback: "#2563eb" },
  zoneFoodTruckStroke: { cssVar: "--boothmap-zone-food-truck-stroke", fallback: "#dc2626" },
  zoneFoodTruckFill: { cssVar: "--boothmap-zone-food-truck-fill", fallback: "#fca5a5" },
  zoneFoodTruckDot: { cssVar: "--boothmap-zone-food-truck-dot", fallback: "#ef4444" },
  overlayLabelBorder: { cssVar: "--boothmap-overlay-label-border", fallback: "#d1d5db" },
  overlayLabelBackground: {
    cssVar: "--boothmap-overlay-label-bg",
    fallback: "rgba(255, 255, 255, 0.95)",
  },
  overlayLabelText: { cssVar: "--boothmap-overlay-label-text", fallback: "#1f2937" },
  overlayBadgeBackground: { cssVar: "--boothmap-overlay-badge-bg", fallback: "#111827" },
  overlayBadgeText: { cssVar: "--boothmap-overlay-badge-text", fallback: "#ffffff" },
  overlayShadow: { cssVar: "--boothmap-overlay-shadow", fallback: "rgba(15, 23, 42, 0.18)" },
} as const satisfies Record<string, BoothmapColorConfig>;

export type BoothmapColorToken = keyof typeof BOOTHMAP_COLOR_CONFIG;

type MarkerTheme = {
  colorToken: BoothmapColorToken;
  iconPath: string;
};

export const BOOTHMAP_MARKER_THEME: Record<BoothmapMarkerType, MarkerTheme> = {
  PUB: {
    colorToken: "markerPub",
    iconPath: "/markers/booth-pub.svg",
  },
  FOOD_TRUCK: {
    colorToken: "markerFoodTruck",
    iconPath: "/markers/booth-foodtruck.svg",
  },
  EXPERIENCE: {
    colorToken: "markerExperience",
    iconPath: "/markers/booth-experience.svg",
  },
  EVENT: {
    colorToken: "markerEvent",
    iconPath: "/markers/booth-event.svg",
  },
  FACILITY: {
    colorToken: "markerFacility",
    iconPath: "/markers/facility-restroom.svg",
  },
};

function readCssColor(cssVar: string): string | null {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  const value = window.getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return value.length > 0 ? value : null;
}

export function getBoothmapColor(token: BoothmapColorToken): string {
  const config = BOOTHMAP_COLOR_CONFIG[token];
  return readCssColor(config.cssVar) ?? config.fallback;
}

export function parseBoothmapMarkerType(type?: string): BoothmapMarkerType {
  if (type === "PUB") return "PUB";
  if (type === "FOOD_TRUCK") return "FOOD_TRUCK";
  if (type === "EXPERIENCE") return "EXPERIENCE";
  if (type === "EVENT") return "EVENT";
  if (type === "FACILITY") return "FACILITY";
  return "EXPERIENCE";
}

export function getBoothmapMarkerTheme(type: BoothmapMarkerType): { color: string; iconPath: string } {
  const theme = BOOTHMAP_MARKER_THEME[type] ?? BOOTHMAP_MARKER_THEME.EXPERIENCE;
  return {
    color: getBoothmapColor(theme.colorToken),
    iconPath: theme.iconPath,
  };
}

export function getBoothmapBoothMarkerTheme(params: {
  type?: string | null;
  subType?: BoothSubType | string | null;
}): { color: string; iconPath: string } {
  const markerType = parseBoothmapMarkerType(params.type ?? undefined);
  const baseTheme = getBoothmapMarkerTheme(markerType);

  if (markerType !== "FACILITY") {
    return baseTheme;
  }

  const normalizedSubType =
    typeof params.subType === "string" ? params.subType.trim().toUpperCase() : null;

  if (normalizedSubType === "SMOKING_AREA") {
    return {
      color: baseTheme.color,
      iconPath: "/markers/facility-smoking.svg",
    };
  }

  return {
    color: baseTheme.color,
    iconPath: "/markers/facility-restroom.svg",
  };
}

export function getBoothmapMarkerColor(type: BoothmapMarkerType): string {
  return getBoothmapMarkerTheme(type).color;
}

export function getBoothmapZonePalette(type: BoothmapZoneType): {
  stroke: string;
  fill: string;
  dot: string;
} {
  if (type === "PUB") {
    return {
      stroke: getBoothmapColor("zonePubStroke"),
      fill: getBoothmapColor("zonePubFill"),
      dot: getBoothmapColor("zonePubDot"),
    };
  }

  return {
    stroke: getBoothmapColor("zoneFoodTruckStroke"),
    fill: getBoothmapColor("zoneFoodTruckFill"),
    dot: getBoothmapColor("zoneFoodTruckDot"),
  };
}

export function getBoothmapLabelAccent(kind: BoothmapLabelKind): string {
  if (kind === "college") {
    return getBoothmapColor("collegeAccent");
  }

  return getBoothmapColor("markerExperience");
}
