// 역할: 티켓 예매 요청/오류 분기/성공 후 상태 반영을 담당하는 액션 훅입니다.
import { useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import { ticketApi } from "@/api/ticketing/ticketApi";
import { useReserveTicketMutation } from "@/hooks/ticketing/useReserveTicketMutation";
import { acquireSingleFlight, releaseSingleFlight } from "@/hooks/ticketing/queue/flow-utils";
import {
  asReserveErrorCode as parseReserveErrorCode,
  DEFAULT_SOLD_OUT_DESCRIPTION,
  parseApiError,
  type ParsedApiError,
} from "@/routes/ticketing/ticketing/ticketing-flow-helpers";
import type { TicketingStep } from "@/routes/ticketing/ticketing/flow/types";
import type { TicketingEvent } from "@/types/ticketing/model/ticket.model";

type UseReservationActionParams = {
  setStep: Dispatch<SetStateAction<TicketingStep>>;
  setEvents: Dispatch<SetStateAction<TicketingEvent[]>>;
  setActiveEventId: Dispatch<SetStateAction<string | null>>;
  setReserveProcessing: Dispatch<SetStateAction<boolean>>;
  setReserveErrorMessage: Dispatch<SetStateAction<string | null>>;
  setReserveMessage: Dispatch<SetStateAction<string>>;
  setAgreementChecked: Dispatch<SetStateAction<boolean>>;
  setThirdPartyPrivacyConsentChecked: Dispatch<SetStateAction<boolean>>;
  setReservationError: Dispatch<SetStateAction<string | null>>;
  setSoldOutDescription: Dispatch<SetStateAction<string>>;
  setListNotice: Dispatch<SetStateAction<string | null>>;
  applyQueueEventToUrl: (eventId: string | null) => void;
  moveToList: (options?: { preserveNotice?: boolean }) => Promise<void>;
  handleUnauthorized: () => void;
};

export const useReservationAction = ({
  setStep,
  setEvents,
  setActiveEventId,
  setReserveProcessing,
  setReserveErrorMessage,
  setReserveMessage,
  setAgreementChecked,
  setThirdPartyPrivacyConsentChecked,
  setReservationError,
  setSoldOutDescription,
  setListNotice,
  applyQueueEventToUrl,
  moveToList,
  handleUnauthorized,
}: UseReservationActionParams) => {
  const reserveLockRef = useRef(false);
  const reserveMutation = useReserveTicketMutation();

  const applyReserveError = useCallback(async (
    eventId: string,
    parsedError: ParsedApiError,
  ) => {
    const reserveCode = parseReserveErrorCode(parsedError.code);
    if (parsedError.status === 401 || reserveCode === "UNAUTHORIZED") {
      handleUnauthorized();
      return;
    }

    switch (reserveCode) {
      case "RESERVE_ALREADY_RESERVED":
        setStep("already");
        setActiveEventId(null);
        setReservationError(null);
        break;
      case "RESERVE_SOLD_OUT":
        setSoldOutDescription(DEFAULT_SOLD_OUT_DESCRIPTION);
        setStep("soldout");
        setActiveEventId(null);
        setReservationError(null);
        break;
      case "RESERVE_NOT_OPEN":
        setStep("in-progress");
        setReserveProcessing(false);
        setReserveMessage("예매 오픈 시간이 아직 되지 않았습니다. 잠시 후 다시 시도해주세요.");
        setReserveErrorMessage("오픈 전 상태입니다. 티켓 오픈 시각 이후 다시 시도해주세요.");
        setReservationError("오픈 전 상태입니다. 티켓 오픈 시각 이후 다시 시도해주세요.");
        break;
      case "EVENT_NOT_FOUND":
        setActiveEventId(null);
        setListNotice("해당 티켓 정보를 찾을 수 없어 목록으로 이동합니다.");
        setReservationError(null);
        await moveToList({ preserveNotice: true });
        break;
      case "TEMPORARY_ERROR":
      default:
        setStep("in-progress");
        setReserveProcessing(false);
        setReserveMessage("일시적인 오류가 발생했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.");
        setReserveErrorMessage("요청 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
        setReservationError("요청 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
        break;
    }

    if (reserveCode === "RESERVE_ALREADY_RESERVED") {
      void ticketApi.getMyTickets().catch(() => null);
    }

    if (reserveCode !== "RESERVE_NOT_OPEN" && reserveCode !== "TEMPORARY_ERROR") {
      applyQueueEventToUrl(null);
    } else {
      applyQueueEventToUrl(eventId);
    }
  }, [
    applyQueueEventToUrl,
    handleUnauthorized,
    moveToList,
    setActiveEventId,
    setListNotice,
    setReservationError,
    setReserveErrorMessage,
    setReserveMessage,
    setReserveProcessing,
    setSoldOutDescription,
    setStep,
  ]);

  const executeReserve = useCallback(async (eventId: string) => {
    if (!acquireSingleFlight(reserveLockRef)) {
      return;
    }

    setStep("reserving");
    setReserveProcessing(true);
    setReserveErrorMessage(null);
    setReserveMessage("입장 상태가 확인되어 예매를 진행하고 있습니다.");
    setReservationError(null);

    try {
      await reserveMutation.mutateAsync(eventId);
      setEvents((prev) =>
        prev.map((event) => {
          if (event.id !== eventId) {
            return event;
          }
          if (event.remainingCount === null) {
            return event;
          }
          return {
            ...event,
            remainingCount: Math.max(event.remainingCount - 1, 0),
          };
        }),
      );
      setStep("success");
      setActiveEventId(null);
      applyQueueEventToUrl(null);
    } catch (error) {
      const parsedError = parseApiError(error);
      await applyReserveError(eventId, parsedError);
    } finally {
      setReserveProcessing(false);
      releaseSingleFlight(reserveLockRef);
    }
  }, [
    applyQueueEventToUrl,
    applyReserveError,
    reserveMutation,
    setActiveEventId,
    setEvents,
    setReservationError,
    setReserveErrorMessage,
    setReserveMessage,
    setReserveProcessing,
    setStep,
  ]);

  const resetReservationAgreement = useCallback(() => {
    setAgreementChecked(false);
    setThirdPartyPrivacyConsentChecked(false);
    setReservationError(null);
  }, [setAgreementChecked, setReservationError, setThirdPartyPrivacyConsentChecked]);

  return {
    executeReserve,
    resetReservationAgreement,
  };
};
