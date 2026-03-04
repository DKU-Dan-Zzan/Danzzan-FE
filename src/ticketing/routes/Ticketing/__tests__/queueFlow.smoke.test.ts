import type { QueueRequestStatus } from "@/ticketing/types/model/ticket.model";
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
} from "@/ticketing/routes/Ticketing/queueFlowUtils";

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
  it("WAITING -> ADMITTED -> ?낅젰/?뺤씤 ?붾㈃ 吏꾩엯", () => {
    const result = runQueueFlowSmoke("WAITING", ["ADMITTED"]);
    expect(result.step).toBe("in-progress");
    expect(result.reserveCalls).toBe(0);
  });

  it("WAITING -> SUCCESS -> ?낅젰/?뺤씤 ?붾㈃ 吏꾩엯", () => {
    const result = runQueueFlowSmoke("WAITING", ["SUCCESS"]);
    expect(result.step).toBe("in-progress");
    expect(result.reserveCalls).toBe(0);
  });

  it("WAITING -> SOLD_OUT 遺꾧린", () => {
    const result = runQueueFlowSmoke("WAITING", ["SOLD_OUT"]);
    expect(result.step).toBe("soldout");
    expect(result.reserveCalls).toBe(0);
  });

  it("WAITING -> ALREADY 遺꾧린", () => {
    const result = runQueueFlowSmoke("WAITING", ["ALREADY"]);
    expect(result.step).toBe("already");
    expect(result.reserveCalls).toBe(0);
  });

  it("single-flight lock??以묐났 reserve 吏꾩엯??留됰뒗??, () => {
    const lock = { current: false };

    expect(acquireSingleFlight(lock)).toBe(true);
    expect(acquireSingleFlight(lock)).toBe(false);
    releaseSingleFlight(lock);
    expect(acquireSingleFlight(lock)).toBe(true);
  });

  it("?덈줈怨좎묠 蹂듭썝??eventId瑜?寃???뚮씪誘명꽣?먯꽌 ?쎈뒗??, () => {
    expect(readQueueEventIdFromSearch("?eventId=42")).toBe("42");
    expect(readQueueEventIdFromSearch("?eventId=%20%20")).toBeNull();
    expect(readQueueEventIdFromSearch("")).toBeNull();
  });

  it("polling 吏??怨꾩궛??諛깆삤??吏??踰붿쐞瑜?吏?⑤떎", () => {
    const minDelay = computePollingDelay(FOREGROUND_POLL_INTERVAL, 0, () => 0);
    const maxDelay = computePollingDelay(FOREGROUND_POLL_INTERVAL, 0, () => 1);
    expect(minDelay).toBe(FOREGROUND_POLL_INTERVAL - POLL_JITTER_MS);
    expect(maxDelay).toBe(FOREGROUND_POLL_INTERVAL + POLL_JITTER_MS);

    const clamped = computePollingDelay(BACKGROUND_POLL_INTERVAL, MAX_BACKOFF_EXPONENT + 4, () => 0.5);
    expect(clamped).toBeGreaterThanOrEqual(BACKGROUND_POLL_INTERVAL);
  });

  it("remaining freshness ?먯젙?쇰줈 stale 媛믪쓣 援щ텇?쒕떎", () => {
    const now = Date.now();
    expect(isRemainingFresh(now - (REMAINING_STALE_MS - 10), now)).toBe(true);
    expect(isRemainingFresh(now - (REMAINING_STALE_MS + 10), now)).toBe(false);
    expect(isRemainingFresh(null, now)).toBe(false);
  });
});
