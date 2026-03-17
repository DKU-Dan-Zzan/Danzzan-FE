export type BoothmapMarkerType = "PUB" | "FOOD_TRUCK" | "EXPERIENCE" | "FACILITY";

type MarkerTheme = {
  color: string;
  iconPath: string;
};

export const BOOTHMAP_MARKER_THEME: Record<BoothmapMarkerType, MarkerTheme> = {
  PUB: {
    color: "#0a559c",
    iconPath: "/markers/booth-pub.svg",
  },
  FOOD_TRUCK: {
    color: "#ef4444",
    iconPath: "/markers/booth-foodtruck.svg",
  },
  EXPERIENCE: {
    color: "#10b981",
    iconPath: "/markers/booth-experience.svg",
  },
  FACILITY: {
    color: "#3b82f6",
    iconPath: "/markers/facility-restroom.svg",
  },
};

export const BOOTHMAP_SELECTED_SHADOW = "rgba(10,85,156,0.28)";
export const BOOTHMAP_SELECTED_SHADOW_SOFT = "rgba(10,85,156,0.25)";
export const BOOTHMAP_SELECTED_RING = "rgba(10,85,156,0.18)";
