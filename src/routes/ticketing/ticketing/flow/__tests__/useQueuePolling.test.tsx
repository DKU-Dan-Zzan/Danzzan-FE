// 역할: 대기열 폴링 훅의 최초 복원 조회 타이밍을 검증합니다.
// @vitest-environment jsdom
import { act, type Dispatch, type SetStateAction } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useQueuePolling } from "@/routes/ticketing/ticketing/flow/useQueuePolling";
import type { TicketingStep } from "@/routes/ticketing/ticketing/flow/types";
import type { QueueRequestStatus } from "@/types/ticketing/model/ticket.model";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type HarnessProps = {
  step: TicketingStep;
  activeEventId: string | null;
  checkQueueStatus: (eventId: string) => Promise<QueueRequestStatus | null>;
  setStep: Dispatch<SetStateAction<TicketingStep>>;
  setQueueStatus: (status: QueueRequestStatus) => void;
  setWaitingError: Dispatch<SetStateAction<string | null>>;
  setWaitingPolling: Dispatch<SetStateAction<boolean>>;
  setIsNetworkOnline: Dispatch<SetStateAction<boolean>>;
};

const Harness = ({
  step,
  activeEventId,
  checkQueueStatus,
  setStep,
  setQueueStatus,
  setWaitingError,
  setWaitingPolling,
  setIsNetworkOnline,
}: HarnessProps) => {
  useQueuePolling({
    step,
    activeEventId,
    isNetworkOnline: true,
    waitingError: null,
    queuePosition: null,
    setStep,
    setQueueStatus,
    setWaitingError,
    setWaitingPolling,
    setIsNetworkOnline,
    checkQueueStatus,
  });

  return null;
};

describe("useQueuePolling", () => {
  let container: HTMLDivElement;
  let root: Root;
  let checkQueueStatus: ReturnType<typeof vi.fn>;
  let setStep: ReturnType<typeof vi.fn>;
  let setQueueStatus: ReturnType<typeof vi.fn>;
  let setWaitingError: ReturnType<typeof vi.fn>;
  let setWaitingPolling: ReturnType<typeof vi.fn>;
  let setIsNetworkOnline: ReturnType<typeof vi.fn>;

  const renderHarness = async (step: TicketingStep, activeEventId: string | null) => {
    await act(async () => {
      root.render(
        <Harness
          step={step}
          activeEventId={activeEventId}
          checkQueueStatus={checkQueueStatus as HarnessProps["checkQueueStatus"]}
          setStep={setStep as HarnessProps["setStep"]}
          setQueueStatus={setQueueStatus as HarnessProps["setQueueStatus"]}
          setWaitingError={setWaitingError as HarnessProps["setWaitingError"]}
          setWaitingPolling={setWaitingPolling as HarnessProps["setWaitingPolling"]}
          setIsNetworkOnline={setIsNetworkOnline as HarnessProps["setIsNetworkOnline"]}
        />,
      );
      await Promise.resolve();
    });
  };

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    checkQueueStatus = vi.fn(async () => "WAITING" as QueueRequestStatus);
    setStep = vi.fn();
    setQueueStatus = vi.fn();
    setWaitingError = vi.fn();
    setWaitingPolling = vi.fn();
    setIsNetworkOnline = vi.fn();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("eventId가 최초 렌더 이후 생기면 즉시 대기 상태를 복원 조회한다", async () => {
    await renderHarness("home", null);
    await renderHarness("home", "31");

    expect(setStep).toHaveBeenCalledWith("waiting");
    expect(checkQueueStatus).toHaveBeenCalledWith("31");
    expect(setWaitingPolling).toHaveBeenCalledWith(true);
  });
});
