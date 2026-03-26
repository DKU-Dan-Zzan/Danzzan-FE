import type { SheetSnap } from "@/types/app/boothmap/boothmap.types";

export const BOTTOM_SHEET_HEIGHT_RATIO: Record<Exclude<SheetSnap, "PEEK">, number> = {
  HALF: 0.33,
  FULL: 0.82,
};

export function getBottomSheetCoveredRatio(snap: SheetSnap) {
  if (snap === "PEEK") return 0;
  return BOTTOM_SHEET_HEIGHT_RATIO[snap];
}

export function getMapboxOffsetYBySnap(sheetSnap: SheetSnap) {
  if (sheetSnap === "FULL") return 220;
  if (sheetSnap === "HALF") return 96;
  return 80;
}
