import type { QueueRequestStatus } from "@/types/ticketing/model/ticket.model";
import {
  BACKGROUND_POLL_INTERVAL,
  FOREGROUND_POLL_INTERVAL,
  MAX_BACKOFF_EXPONENT,
  POLL_JITTER_MS,
  REMAINING_STALE_MS,
  acquireSingleFlight,
  computePollingDelay,
  isRemainingFresh,
  readQueueEventIdFromSearch,
  releaseSingleFlight,
  resolveQueueStatusAction,
} from "@/routes/ticketing/Ticketing/queueFlowUtils";

type SmokeStep = "waiting" | "in-progress" | "reserving" | "soldout" | "already" | "success" | "list";

const runQueueFlowSmoke = (
  enterStatus: QueueRequestStatus,
  polledStatuses: QueueRequestStatus[],
): { step: SmokeStep; reserveCalls: number } => {
  let step: SmokeStep = "list";
  let reserveCalls = 0;

  const applyStatus = (status: QueueRequestStatus) => {
    const action = resolveQueueStatusAction(status);
    switch (action) {
      case "waiting":
        step = "waiting";
        return;
      case "reserve":
        step = "in-progress";
        return;
      case "soldout":
        step = "soldout";
        return;
      case "already":
        step = "already";
        return;
      default:
        step = "list";
    }
  };

  applyStatus(enterStatus);
  for (const status of polledStatuses) {
    if (step !== "waiting") {
      break;
    }
    applyStatus(status);
  }

  return { step, reserveCalls };
};

describe("queueFlow smoke", () => {
  it("WAITING -> ADMITTED -> 입력/확인 화면 진입", () => {
    const result = runQueueFlowSmoke("WAITING", ["ADMITTED"]);
    expect(result.step).toBe("in-progress");
    expect(result.reserveCalls).toBe(0);
  });

  it("WAITING -> SUCCESS -> 입력/확인 화면 진입", () => {
    const result = runQueueFlowSmoke("WAITING", ["SUCCESS"]);
    expect(result.step).toBe("in-progress");
    expect(result.reserveCalls).toBe(0);
  });

  it("WAITING -> SOLD_OUT 분기", () => {
    const result = runQueueFlowSmoke("WAITING", ["SOLD_OUT"]);
    expect(result.step).toBe("soldout");
    expect(result.reserveCalls).toBe(0);
  });

  it("WAITING -> ALREADY 분기", () => {
    const result = runQueueFlowSmoke("WAITING", ["ALREADY"]);
    expect(result.step).toBe("already");
    expect(result.reserveCalls).toBe(0);
  });

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
    expect(minDelay).toBe(FOREGROUND_POLL_INTERVAL - POLL_JITTER_MS);
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
