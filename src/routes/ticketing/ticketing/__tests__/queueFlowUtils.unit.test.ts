// 역할: 대기열 폴링/복원 유틸의 순수 함수 동작을 단위 테스트로 검증합니다.
import {
  BACKGROUND_POLL_INTERVAL,
  FOREGROUND_POLL_INTERVAL,
  MAX_BACKOFF_EXPONENT,
  MIN_POLL_DELAY_MS,
  POLL_JITTER_MS,
  REMAINING_STALE_MS,
  acquireSingleFlight,
  computePollingDelay,
  isRemainingFresh,
  readQueueEventIdFromSearch,
  releaseSingleFlight,
} from "@/routes/ticketing/ticketing/queueFlowUtils";

describe("queueFlowUtils unit", () => {
  it("single-flight lock이 중복 reserve 진입을 막는다", () => {
    const lock = { current: false };

    expect(acquireSingleFlight(lock)).toBe(true);
    expect(acquireSingleFlight(lock)).toBe(false);
    releaseSingleFlight(lock);
    expect(acquireSingleFlight(lock)).toBe(true);
  });

  it("새로고침 복원용 eventId를 검색 파라미터에서 읽는다", () => {
    expect(readQueueEventIdFromSearch("?eventId=42")).toBe("42");
    expect(readQueueEventIdFromSearch("?eventId=%20%20")).toBeNull();
    expect(readQueueEventIdFromSearch("")).toBeNull();
  });

  it("polling 지연 계산이 백오프+지터 범위를 지킨다", () => {
    const minDelay = computePollingDelay(FOREGROUND_POLL_INTERVAL, 0, () => 0);
    const maxDelay = computePollingDelay(FOREGROUND_POLL_INTERVAL, 0, () => 1);
    expect(minDelay).toBe(Math.max(MIN_POLL_DELAY_MS, FOREGROUND_POLL_INTERVAL - POLL_JITTER_MS));
    expect(maxDelay).toBe(FOREGROUND_POLL_INTERVAL + POLL_JITTER_MS);

    const clamped = computePollingDelay(BACKGROUND_POLL_INTERVAL, MAX_BACKOFF_EXPONENT + 4, () => 0.5);
    expect(clamped).toBeGreaterThanOrEqual(BACKGROUND_POLL_INTERVAL);
  });

  it("remaining freshness 판정으로 stale 값을 구분한다", () => {
    const now = Date.now();
    expect(isRemainingFresh(now - (REMAINING_STALE_MS - 10), now)).toBe(true);
    expect(isRemainingFresh(now - (REMAINING_STALE_MS + 10), now)).toBe(false);
    expect(isRemainingFresh(null, now)).toBe(false);
  });
});
