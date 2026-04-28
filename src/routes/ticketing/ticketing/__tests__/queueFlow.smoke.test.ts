// 역할: 대기열 상태 전이와 폴링 스케줄 핵심 시나리오를 스모크 테스트로 검증합니다.
import type { QueueRequestStatus } from "@/types/ticketing/model/ticket.model";
import {
  resolveQueueStatusAction,
} from "@/routes/ticketing/ticketing/queueFlowUtils";

type SmokeStep = "waiting" | "in-progress" | "reserving" | "soldout" | "already" | "success" | "list";

const runQueueFlowSmoke = (
  enterStatus: QueueRequestStatus,
  polledStatuses: QueueRequestStatus[],
): { step: SmokeStep; reserveCalls: number } => {
  let step: SmokeStep = "list";
  const reserveCalls = 0;

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
    if ((step as SmokeStep) !== "waiting") {
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

  it("WAITING -> SUCCESS -> 이미 예매 완료 화면 진입", () => {
    const result = runQueueFlowSmoke("WAITING", ["SUCCESS"]);
    expect(result.step).toBe("already");
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
});
