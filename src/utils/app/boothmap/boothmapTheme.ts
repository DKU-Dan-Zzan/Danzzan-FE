// 역할: 부스맵 카테고리별 색상/아이콘 테마 매핑 유틸을 제공한다.

import type { BoothSubType } from "@/types/app/boothmap/boothmap.types";

export type BoothmapMarkerType = "PUB" | "FOOD_TRUCK" | "EXPERIENCE" | "EVENT" | "FACILITY" | "REST_AREA";
export type BoothmapZoneType = "PUB" | "FOOD_TRUCK" | "SMOKING_AREA";
export type BoothmapLabelKind = "booth" | "college";

type BoothmapColorConfig = {
  cssVar: string;
  fallback: string;
};

const BOOTHMAP_COLOR_CONFIG = {
  // Fallbacks mirror the default Theme Core and its polygon color-mix ratios in index.css.
  markerPub: { cssVar: "--boothmap-marker-pub", fallback: "#ff642d" },
  markerFoodTruck: { cssVar: "--boothmap-marker-food-truck", fallback: "#ec4899" },
  markerExperience: { cssVar: "--boothmap-marker-experience", fallback: "#10b981" },
  markerEvent: { cssVar: "--boothmap-marker-event", fallback: "#f6ca3b" },
  markerRestArea: { cssVar: "--boothmap-marker-rest-area", fallback: "#8b5cf6" },
  markerFacility: { cssVar: "--boothmap-marker-facility", fallback: "#3b82f6" },
  selectedShadow: { cssVar: "--boothmap-selected-shadow", fallback: "rgba(55, 79, 132, 0.28)" },
  selectedShadowSoft: {
    cssVar: "--boothmap-selected-shadow-soft",
    fallback: "rgba(55, 79, 132, 0.25)",
  },
  selectedRing: { cssVar: "--boothmap-selected-ring", fallback: "rgba(55, 79, 132, 0.18)" },
  collegeAccent: { cssVar: "--boothmap-college-accent", fallback: "#2563eb" },
  collegeStrokeDefault: { cssVar: "--boothmap-college-stroke-default", fallback: "#1e40af" },
  collegeStrokeSelected: { cssVar: "--boothmap-college-stroke-selected", fallback: "#1d4ed8" },
  collegeFillDefault: { cssVar: "--boothmap-college-fill-default", fallback: "#eff6ff" },
  collegeFillSelected: { cssVar: "--boothmap-college-fill-selected", fallback: "#dbeafe" },
  zonePubStroke: { cssVar: "--boothmap-zone-pub-stroke", fallback: "#e65a29" },
  zonePubFill: { cssVar: "--boothmap-zone-pub-fill", fallback: "#ffc1ab" },
  zonePubDot: { cssVar: "--boothmap-zone-pub-dot", fallback: "#ff642d" },
  zoneFoodTruckStroke: { cssVar: "--boothmap-zone-food-truck-stroke", fallback: "#bd3a7a" },
  zoneFoodTruckFill: { cssVar: "--boothmap-zone-food-truck-fill", fallback: "#fad1e6" },
  zoneFoodTruckDot: { cssVar: "--boothmap-zone-food-truck-dot", fallback: "#ec4899" },
  zoneSmokingStroke: { cssVar: "--boothmap-zone-smoking-stroke", fallback: "#475569" },
  zoneSmokingFill: { cssVar: "--boothmap-zone-smoking-fill", fallback: "#cbd5e1" },
  zoneSmokingDot: { cssVar: "--boothmap-zone-smoking-dot", fallback: "#334155" },
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
  REST_AREA: {
    colorToken: "markerRestArea",
    iconPath: "/markers/booth-restarea.svg",
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

  // Map SDK colors need a resolved CSS color, not an unevaluated color-mix() custom property.
  // Resolve against :root so a future festival theme applied there also reaches map polygons.
  const root = document.documentElement;
  const value = window.getComputedStyle(root).getPropertyValue(cssVar).trim();
  if (!value) return null;
  if (!value.includes("color-mix(") && !value.includes("var(")) return value;

  const probe = document.createElement("span");
  probe.style.color = `var(${cssVar})`;
  probe.style.display = "none";
  root.appendChild(probe);
  try {
    const resolved = window.getComputedStyle(probe).color;
    return resolved || value;
  } finally {
    probe.remove();
  }
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
  if (type === "REST_AREA") return "REST_AREA";
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
  name?: string | null;
}): { color: string; iconPath: string } {
  const markerType = parseBoothmapMarkerType(params.type ?? undefined);
  const baseTheme = getBoothmapMarkerTheme(markerType);

  if (markerType !== "FACILITY") {
    return baseTheme;
  }

  const normalizedSubType =
    typeof params.subType === "string" ? params.subType.trim().toUpperCase() : null;
  const normalizedName = typeof params.name === "string" ? params.name.trim() : "";

  if (normalizedSubType === "SMOKING_AREA") {
    return {
      color: baseTheme.color,
      iconPath: "/markers/facility-smoking.svg",
    };
  }

  if (normalizedName.includes("화장실")) {
    return {
      color: baseTheme.color,
      iconPath: "/markers/facility-restroom.svg",
    };
  }

  return {
    color: baseTheme.color,
    iconPath: "/markers/facility-info.svg",
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

  if (type === "SMOKING_AREA") {
    return {
      stroke: getBoothmapColor("zoneSmokingStroke"),
      fill: getBoothmapColor("zoneSmokingFill"),
      dot: getBoothmapColor("zoneSmokingDot"),
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
