import { describe, expect, it } from "vitest";
import {
  getBoothmapColor,
  getBoothmapLabelAccent,
  getBoothmapMarkerTheme,
  getBoothmapZonePalette,
  parseBoothmapMarkerType,
} from "@/utils/app/boothmap/boothmapTheme";

describe("boothmapTheme", () => {
  it("알 수 없는 타입은 EXPERIENCE로 정규화한다", () => {
    expect(parseBoothmapMarkerType("EXPERIENCE")).toBe("EXPERIENCE");
    expect(parseBoothmapMarkerType("UNKNOWN")).toBe("EXPERIENCE");
    expect(parseBoothmapMarkerType(undefined)).toBe("EXPERIENCE");
  });

  it("마커 테마는 단일 소스 색상/아이콘을 반환한다", () => {
    expect(getBoothmapMarkerTheme("EVENT")).toEqual({
      color: "#f6ca3b",
      iconPath: "/markers/booth-event.svg",
    });
  });

  it("존 팔레트는 타입별 색상을 제공한다", () => {
    expect(getBoothmapZonePalette("PUB")).toEqual({
      stroke: "#1d4ed8",
      fill: "#93c5fd",
      dot: "#2563eb",
    });
    expect(getBoothmapZonePalette("FOOD_TRUCK")).toEqual({
      stroke: "#dc2626",
      fill: "#fca5a5",
      dot: "#ef4444",
    });
  });

  it("라벨 accent는 kind에 맞게 분기한다", () => {
    expect(getBoothmapLabelAccent("college")).toBe("#2563eb");
    expect(getBoothmapLabelAccent("booth")).toBe("#10b981");
  });

  it("브라우저 환경이 아니면 fallback 색상을 반환한다", () => {
    expect(getBoothmapColor("overlayBadgeText")).toBe("#ffffff");
    expect(getBoothmapColor("overlayBadgeBackground")).toBe("#111827");
  });
});
