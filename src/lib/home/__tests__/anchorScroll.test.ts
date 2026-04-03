// 역할: 홈 앵커 스크롤 트리거/락 해제 조건을 검증합니다.
import { describe, expect, it } from "vitest";
import {
  HOME_ANCHOR_TOP_TOLERANCE_PX,
  HOME_ANCHOR_TRIGGER_DELTA_PX,
  shouldReleaseHomeAnchorLock,
  shouldTriggerHomeAnchor,
} from "@/lib/home/anchorScroll";

describe("home anchor scroll logic", () => {
  it("상단 근처에서 임계치 이상의 하향 스크롤 입력이면 앵커 이동을 트리거한다", () => {
    expect(shouldTriggerHomeAnchor({
      deltaY: HOME_ANCHOR_TRIGGER_DELTA_PX + 1,
      scrollTop: HOME_ANCHOR_TOP_TOLERANCE_PX - 1,
      isLocked: false,
    })).toBe(true);
  });

  it("스크롤 입력이 작으면 앵커 이동을 트리거하지 않는다", () => {
    expect(shouldTriggerHomeAnchor({
      deltaY: HOME_ANCHOR_TRIGGER_DELTA_PX - 1,
      scrollTop: 0,
      isLocked: false,
    })).toBe(false);
  });

  it("이미 락된 상태면 앵커 이동을 트리거하지 않는다", () => {
    expect(shouldTriggerHomeAnchor({
      deltaY: HOME_ANCHOR_TRIGGER_DELTA_PX + 8,
      scrollTop: 0,
      isLocked: true,
    })).toBe(false);
  });

  it("상단 구간 밖에서는 앵커 이동을 트리거하지 않는다", () => {
    expect(shouldTriggerHomeAnchor({
      deltaY: HOME_ANCHOR_TRIGGER_DELTA_PX + 8,
      scrollTop: HOME_ANCHOR_TOP_TOLERANCE_PX + 40,
      isLocked: false,
    })).toBe(false);
  });

  it("스크롤이 최상단으로 복귀하면 락 해제 조건을 만족한다", () => {
    expect(shouldReleaseHomeAnchorLock(0)).toBe(true);
  });
});
