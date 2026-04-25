// 역할: 티켓팅 플로우 훅의 목록→대기열→예매 핵심 전이 경로를 통합 테스트합니다.
// @vitest-environment jsdom
import { act, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { useTicketingFlow } from "@/routes/ticketing/ticketing/useTicketingFlow";
import type { QueueRequestStatus } from "@/types/ticketing/model/ticket.model";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockEnterQueueMutateAsync = vi.fn();
const mockEventsRefetch = vi.fn(async () => undefined);
const mockRefetchQueueStatus = vi.fn(async () => ({ data: null, error: null }));
const mockApplyQueueEventToUrl = vi.fn();
const mockExecuteReserve = vi.fn(async () => undefined);
const mockResetReservationAgreement = vi.fn();

vi.mock("@/hooks/ticketing/useEnterQueueMutation", () => ({
  useEnterQueueMutation: () => ({
    mutateAsync: mockEnterQueueMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/hooks/ticketing/useTicketingEventsQuery", () => ({
  useTicketingEventsQuery: () => ({
    data: [
      { id: "event-1", title: "메인 이벤트", remainingCount: 2 },
      { id: "event-2", title: "서브 이벤트", remainingCount: 1 },
    ],
    isPending: false,
    isFetching: false,
    error: null,
    refetch: mockEventsRefetch,
  }),
}));

vi.mock("@/hooks/ticketing/useWaitingRoomAdQuery", () => ({
  useWaitingRoomAdQuery: () => ({
    data: null,
  }),
}));

vi.mock("@/hooks/ticketing/useQueueStatusQuery", () => ({
  useQueueStatusQuery: () => ({
    refetch: mockRefetchQueueStatus,
  }),
}));

vi.mock("@/routes/ticketing/ticketing/flow/useQueueUrlSync", () => ({
  useQueueUrlSync: () => ({
    applyQueueEventToUrl: mockApplyQueueEventToUrl,
    queueEventFromSearch: null,
  }),
}));

vi.mock("@/routes/ticketing/ticketing/flow/useReservationAction", () => ({
  useReservationAction: () => ({
    executeReserve: mockExecuteReserve,
    resetReservationAgreement: mockResetReservationAgreement,
  }),
}));

vi.mock("@/routes/ticketing/ticketing/flow/useQueuePolling", () => ({
  useQueuePolling: () => undefined,
}));

describe("useTicketingFlow integration", () => {
  let latestFlow: ReturnType<typeof useTicketingFlow> | null = null;

  const Probe = ({ onFlow }: { onFlow: (flow: ReturnType<typeof useTicketingFlow>) => void }) => {
    const flow = useTicketingFlow();

    useEffect(() => {
      onFlow(flow);
    }, [flow, onFlow]);

    return null;
  };

  beforeEach(() => {
    latestFlow = null;
    mockApplyQueueEventToUrl.mockReset();
    mockEventsRefetch.mockClear();
    mockExecuteReserve.mockClear();
    mockEnterQueueMutateAsync.mockReset();
    mockResetReservationAgreement.mockClear();
    mockRefetchQueueStatus.mockClear();
    mockEnterQueueMutateAsync.mockResolvedValue({
      status: "WAITING" as QueueRequestStatus,
      queuePosition: 7,
    });
  });

  it("목록 진입, 대기열 진입, 예매 제출 경로를 처리한다", async () => {
    const queryClient = new QueryClient();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={["/ticket/ticketing"]}>
            <Probe
              onFlow={(flow) => {
                latestFlow = flow;
              }}
            />
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });

    expect(latestFlow).not.toBeNull();

    await act(async () => {
      latestFlow?.openList();
    });

    await act(async () => {
      await latestFlow?.selectEvent({ id: "event-1", title: "메인 이벤트" });
    });

    expect(mockEnterQueueMutateAsync).toHaveBeenCalledWith("event-1");
    expect(mockApplyQueueEventToUrl).toHaveBeenCalledWith("event-1");
    expect(mockResetReservationAgreement).toHaveBeenCalled();

    await act(async () => {
      latestFlow?.changeAgreement(true);
    });

    await act(async () => {
      latestFlow?.submitReservation();
    });

    expect(mockExecuteReserve).not.toHaveBeenCalled();
    expect(latestFlow?.reservationError).toBe("개인정보 제3자 제공 동의(필수)를 체크해주세요.");

    await act(async () => {
      (
        latestFlow as ReturnType<typeof useTicketingFlow> & {
          changeThirdPartyPrivacyConsent: (checked: boolean) => void;
        }
      ).changeThirdPartyPrivacyConsent(true);
    });

    await act(async () => {
      latestFlow?.submitReservation();
    });

    expect(mockExecuteReserve).toHaveBeenCalledWith("event-1");

    await act(async () => {
      latestFlow?.backToList();
    });

    expect(mockEventsRefetch).toHaveBeenCalled();
    expect(mockApplyQueueEventToUrl).toHaveBeenLastCalledWith(null);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
