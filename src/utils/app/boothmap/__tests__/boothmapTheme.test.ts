import { describe, expect, it } from "vitest";
import {
  getBoothmapBoothMarkerTheme,
  getBoothmapColor,
  getBoothmapLabelAccent,
  getBoothmapMarkerTheme,
  getBoothmapZonePalette,
  parseBoothmapMarkerType,
} from "@/utils/app/boothmap/boothmapTheme";

describe("boothmapTheme", () => {
  it("쉼터는 편의시설 subtype과 무관하게 전용 아이콘을 사용한다", () => {
    expect(parseBoothmapMarkerType("REST_AREA")).toBe("REST_AREA");
    expect(getBoothmapBoothMarkerTheme({ type: "REST_AREA", subType: "SMOKING_AREA" })).toEqual({
      color: "#8b5cf6",
      iconPath: "/markers/booth-restarea.svg",
    });
  });

  it("알 수 없는 타입은 EXPERIENCE로 정규화한다", () => {
    expect(parseBoothmapMarkerType("EXPERIENCE")).toBe("EXPERIENCE");
    expect(parseBoothmapMarkerType("UNKNOWN")).toBe("EXPERIENCE");
    expect(parseBoothmapMarkerType(undefined)).toBe("EXPERIENCE");
  });

  it("마커 테마는 타입별 색상과 아이콘을 반환한다", () => {
    expect(getBoothmapMarkerTheme("EVENT")).toEqual({
      color: "#f6ca3b",
      iconPath: "/markers/booth-event.svg",
    });
    expect(getBoothmapMarkerTheme("PUB")).toEqual({
      color: "#2853A9",
      iconPath: "/markers/booth-pub.svg",
    });
  });

  it("구역 팔레트는 타입별 색상을 제공한다", () => {
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
    expect(getBoothmapZonePalette("SMOKING_AREA")).toEqual({
      stroke: "#475569",
      fill: "#cbd5e1",
      dot: "#334155",
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

  it("FACILITY는 흡연구역을 smoking 아이콘에 매핑한다", () => {
    expect(getBoothmapBoothMarkerTheme({ type: "FACILITY", subType: "SMOKING_AREA" })).toEqual({
      color: "#3b82f6",
      iconPath: "/markers/facility-smoking.svg",
    });
  });

  it("FACILITY는 이름에 화장실이 포함되면 restroom 아이콘을 사용한다", () => {
    expect(
      getBoothmapBoothMarkerTheme({ type: "FACILITY", subType: "TOILET", name: "남자 화장실" }),
    ).toEqual({
      color: "#3b82f6",
      iconPath: "/markers/facility-restroom.svg",
    });
  });

  it("그 외 FACILITY는 info 아이콘으로 fallback한다", () => {
    expect(
      getBoothmapBoothMarkerTheme({ type: "FACILITY", subType: "UNKNOWN", name: "GS25 주류" }),
    ).toEqual({
      color: "#3b82f6",
      iconPath: "/markers/facility-info.svg",
    });
  });
});
