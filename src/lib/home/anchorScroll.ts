// 역할: 홈 화면 첫 스크롤 입력을 라인업 앵커 점프로 변환하는 조건 유틸을 제공합니다.
export const HOME_ANCHOR_TRIGGER_DELTA_PX = 8;
export const HOME_ANCHOR_TOP_TOLERANCE_PX = 28;
export const HOME_ANCHOR_LOCK_RELEASE_TOP_PX = 4;

type HomeAnchorTriggerInput = {
  deltaY: number;
  scrollTop: number;
  isLocked: boolean;
};

export const shouldTriggerHomeAnchor = ({
  deltaY,
  scrollTop,
  isLocked,
}: HomeAnchorTriggerInput) => {
  if (isLocked) return false;
  if (deltaY <= HOME_ANCHOR_TRIGGER_DELTA_PX) return false;
  return scrollTop <= HOME_ANCHOR_TOP_TOLERANCE_PX;
};

export const shouldReleaseHomeAnchorLock = (scrollTop: number) =>
  scrollTop <= HOME_ANCHOR_LOCK_RELEASE_TOP_PX;
