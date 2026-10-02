// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { HttpError } from "@/api/ticketing/httpClient";
import { normalizeAppError } from "@/lib/error/appError";
import { useReservationAction } from "@/routes/ticketing/ticketing/flow/useReservationAction";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const mutateAsync = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/ticketing/useReserveTicketMutation", () => ({
  useReserveTicketMutation: () => ({ mutateAsync }),
}));

afterEach(() => vi.clearAllMocks());

it("서버 발급 처리 실패를 매진이나 중복 예매로 안내하지 않는다", async () => {
  mutateAsync.mockRejectedValue(new HttpError("처리 실패", 409, { code: "RESERVE_PROCESSING_FAILED" }));
  function Probe() {
    const [message, setMessage] = useState<string | null>(null);
    const { executeReserve } = useReservationAction({
      setStep: vi.fn(), setEvents: vi.fn(), setActiveEventId: vi.fn(),
      setReserveProcessing: vi.fn(), setReserveErrorMessage: vi.fn(), setReserveMessage: vi.fn(),
      setAgreementChecked: vi.fn(), setThirdPartyPrivacyConsentChecked: vi.fn(),
      setReservationError: setMessage, setSoldOutDescription: vi.fn(), setListNotice: vi.fn(),
      applyQueueEventToUrl: vi.fn(), moveToList: vi.fn(), handleUnauthorized: vi.fn(),
    });
    return <><button onClick={() => void executeReserve("9")}>예매</button><p>{message}</p></>;
  }
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    await act(async () => root.render(<Probe />));
    await act(async () => container.querySelector("button")!.click());
    expect(container.querySelector("p")?.textContent).toContain("처리 중 오류");
    expect(container.querySelector("p")?.textContent).not.toMatch(/매진|중복 예매|마감/);
  } finally {
    await act(async () => root.unmount());
  }
});

it("공통 mutation이 변환한 입장 만료 오류도 읽어 폼을 닫고 재참여 안내를 보여준다", async () => {
  mutateAsync.mockRejectedValue(normalizeAppError(new HttpError("만료", 400, { code: "RESERVE_ADMISSION_EXPIRED" })));
  let queueEvent: string | null = "9";
  function Probe() {
    const [step, setStep] = useState<import("@/routes/ticketing/ticketing/flow/types").TicketingStep>("in-progress");
    const [notice, setNotice] = useState<string | null>(null);
    const [agreed, setAgreed] = useState(true);
    const { executeReserve } = useReservationAction({
      setStep, setEvents: vi.fn(), setActiveEventId: vi.fn(),
      setReserveProcessing: vi.fn(), setReserveErrorMessage: vi.fn(), setReserveMessage: vi.fn(),
      setAgreementChecked: setAgreed, setThirdPartyPrivacyConsentChecked: vi.fn(),
      setReservationError: vi.fn(), setSoldOutDescription: vi.fn(), setListNotice: setNotice,
      applyQueueEventToUrl: id => { queueEvent = id; }, moveToList: async () => setStep("list"), handleUnauthorized: vi.fn(),
    });
    return <><button onClick={() => void executeReserve("9")}>예매</button><p>{step} {String(agreed)} {notice}</p></>;
  }
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    await act(async () => root.render(<Probe />));
    await act(async () => container.querySelector("button")!.click());
    expect(container.textContent).toContain("list false");
    expect(container.textContent).toContain("다시 참여");
    expect(queueEvent).toBeNull();
  } finally { await act(async () => root.unmount()); }
});
