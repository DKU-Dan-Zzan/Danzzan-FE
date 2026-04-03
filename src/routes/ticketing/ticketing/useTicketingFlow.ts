// 역할: 티켓팅 전체 상태머신(대기열·예매·성공/실패)과 사이드이펙트를 관리하는 핵심 훅입니다.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { useEnterQueueMutation } from "@/hooks/ticketing/useEnterQueueMutation";
import { useQueueStatusQuery } from "@/hooks/ticketing/useQueueStatusQuery";
import { useTicketingEventsQuery } from "@/hooks/ticketing/useTicketingEventsQuery";
import { useWaitingRoomAdQuery } from "@/hooks/ticketing/useWaitingRoomAdQuery";
import { appQueryKeys } from "@/lib/query";
import {
  acquireSingleFlight,
  releaseSingleFlight,
  resolveQueueStatusAction,
} from "@/hooks/ticketing/queue/flow-utils";
import {
  OFFLINE_WAITING_MESSAGE,
  parseApiError,
} from "@/routes/ticketing/ticketing/ticketing-flow-helpers";
import { useQueuePolling } from "@/routes/ticketing/ticketing/flow/useQueuePolling";
import { useQueueUrlSync } from "@/routes/ticketing/ticketing/flow/useQueueUrlSync";
import { useReservationAction } from "@/routes/ticketing/ticketing/flow/useReservationAction";
import type { TicketingStep } from "@/routes/ticketing/ticketing/flow/types";
import type { QueueRequestStatus, TicketingEvent } from "@/types/ticketing/model/ticket.model";
import {
  DEFAULT_SOLD_OUT_DESCRIPTION,
  QUEUE_WAITING_SOLD_OUT_DESCRIPTION,
} from "@/routes/ticketing/ticketing/ticketing-flow-helpers";

export type { TicketingStep } from "@/routes/ticketing/ticketing/flow/types";

export function useTicketingFlow() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const enterQueueMutation = useEnterQueueMutation();
  const enterLockRef = useRef(false);

  const [step, setStep] = useState<TicketingStep>("home");
  const [now, setNow] = useState(() => Date.now());
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeEventTitle, setActiveEventTitle] = useState("");
  const [activeEventDate, setActiveEventDate] = useState("");

  const [, setQueueStatus] = useState<QueueRequestStatus>("NONE");
  const [waitingQueuePosition, setWaitingQueuePosition] = useState<number | null>(null);
  const [waitingQueuePositionUpdatedAt, setWaitingQueuePositionUpdatedAt] = useState<number | null>(null);
  const [waitingPolling, setWaitingPolling] = useState(false);
  const [waitingError, setWaitingError] = useState<string | null>(null);
  const [listNotice, setListNotice] = useState<string | null>(null);
  const [isNetworkOnline, setIsNetworkOnline] = useState(() => window.navigator.onLine);

  const [reserveProcessing, setReserveProcessing] = useState(false);
  const [reserveErrorMessage, setReserveErrorMessage] = useState<string | null>(null);
  const [reserveMessage, setReserveMessage] = useState("입장 상태가 확인되어 예매를 진행하고 있습니다.");
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [soldOutDescription, setSoldOutDescription] = useState(DEFAULT_SOLD_OUT_DESCRIPTION);

  const eventsQuery = useTicketingEventsQuery(step === "list");
  const waitingAdQuery = useWaitingRoomAdQuery(step === "waiting");
  const { refetch: refetchQueueStatus } = useQueueStatusQuery(activeEventId, { enabled: false });

  const resetQueueFlowState = useCallback(() => {
    setQueueStatus("NONE");
    setWaitingQueuePosition(null);
    setWaitingQueuePositionUpdatedAt(null);
    setWaitingError(null);
    setWaitingPolling(false);
    setSoldOutDescription(DEFAULT_SOLD_OUT_DESCRIPTION);
    setReserveProcessing(false);
    setReserveErrorMessage(null);
    setReserveMessage("입장 상태가 확인되어 예매를 진행하고 있습니다.");
    setAgreementChecked(false);
    setReservationError(null);
  }, []);

  const clearQueueError = useCallback(() => {
    setListNotice(null);
  }, []);

  const { applyQueueEventToUrl } = useQueueUrlSync({
    activeEventId,
    setActiveEventId,
    setActiveEventTitle,
    setActiveEventDate,
    setListNotice,
    setStep,
    resetQueueFlowState,
    clearError: clearQueueError,
  });

  const { executeReserve, resetReservationAgreement } = useReservationAction({
    setStep,
    setEvents: (updater) => {
      queryClient.setQueryData<TicketingEvent[]>(
        appQueryKeys.ticketingEvents(),
        (current = []) =>
          typeof updater === "function"
            ? (updater as (previous: TicketingEvent[]) => TicketingEvent[])(current)
            : updater,
      );
    },
    setActiveEventId,
    setReserveProcessing,
    setReserveErrorMessage,
    setReserveMessage,
    setAgreementChecked,
    setReservationError,
    setSoldOutDescription,
    setListNotice,
    applyQueueEventToUrl,
    moveToList: async (options?: { preserveNotice?: boolean }) => {
      setStep("list");
      if (!options?.preserveNotice) {
        setListNotice(null);
      }
      await eventsQuery.refetch();
    },
    handleUnauthorized: () => {
      const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
      navigate(`/ticket/login?redirect=${redirect}`, { replace: true });
    },
  });

  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
  const listLoading = eventsQuery.isPending || eventsQuery.isFetching;
  const listErrorMessage = useMemo(() => {
    if (listNotice) {
      return listNotice;
    }
    return eventsQuery.error?.message ?? null;
  }, [eventsQuery.error?.message, listNotice]);

  useEffect(() => {
    if (!activeEventId) {
      setActiveEventTitle("");
      setActiveEventDate("");
      return;
    }
    const matched = events.find((event) => event.id === activeEventId);
    if (matched) {
      setActiveEventTitle(matched.title);
      setActiveEventDate(matched.eventDate);
    }
  }, [activeEventId, events]);

  const updateWaitingQueuePosition = useCallback((queuePosition: number | null) => {
    setWaitingQueuePosition(queuePosition);
    setWaitingQueuePositionUpdatedAt(Date.now());
  }, []);

  const moveToList = useCallback(async (options?: { preserveNotice?: boolean }) => {
    setStep("list");
    if (!options?.preserveNotice) {
      setListNotice(null);
    }
    await eventsQuery.refetch();
  }, [eventsQuery, setStep]);

  const handleUnauthorized = useCallback(() => {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    navigate(`/ticket/login?redirect=${redirect}`, { replace: true });
  }, [location.pathname, location.search, navigate]);

  const handleQueueStatus = useCallback(async (
    status: QueueRequestStatus,
    eventId: string,
    queuePosition?: number | null,
    source: "enter" | "poll" = "enter",
  ) => {
    setQueueStatus(status);
    if (typeof queuePosition === "number" || queuePosition === null) {
      updateWaitingQueuePosition(queuePosition);
    }

    const action = resolveQueueStatusAction(status);
    switch (action) {
      case "waiting":
        setStep("waiting");
        return;
      case "reserve":
        setWaitingError(null);
        resetReservationAgreement();
        setStep("in-progress");
        return;
      case "soldout":
        setSoldOutDescription(
          source === "poll" ? QUEUE_WAITING_SOLD_OUT_DESCRIPTION : DEFAULT_SOLD_OUT_DESCRIPTION,
        );
        setStep("soldout");
        setActiveEventId(null);
        applyQueueEventToUrl(null);
        return;
      case "already":
        setStep("already");
        setActiveEventId(null);
        applyQueueEventToUrl(null);
        return;
      default:
        setActiveEventId(null);
        setListNotice("현재 대기 상태를 확인할 수 없어 목록으로 이동합니다.");
        applyQueueEventToUrl(null);
        await moveToList({ preserveNotice: true });
    }
  }, [applyQueueEventToUrl, moveToList, resetReservationAgreement, updateWaitingQueuePosition]);

  const checkQueueStatus = useCallback(async (
    eventId: string,
  ): Promise<QueueRequestStatus | null> => {
    if (!isNetworkOnline) {
      setWaitingPolling(false);
      setWaitingError(OFFLINE_WAITING_MESSAGE);
      return null;
    }

    if (activeEventId !== eventId) {
      return null;
    }

    try {
      const queryResult = await refetchQueueStatus();
      if (queryResult.error) {
        throw queryResult.error;
      }
      const statusResponse = queryResult.data;
      if (!statusResponse) {
        return null;
      }

      setWaitingError(null);
      await handleQueueStatus(
        statusResponse.status,
        eventId,
        statusResponse.queuePosition,
        "poll",
      );
      return statusResponse.status;
    } catch (error) {
      const parsed = parseApiError(error);
      if (parsed.status === 401 || parsed.code === "UNAUTHORIZED") {
        handleUnauthorized();
        return null;
      }

      setWaitingError("네트워크 상태가 불안정합니다. 잠시 후 자동으로 다시 확인합니다.");
      return null;
    }
  }, [activeEventId, handleQueueStatus, handleUnauthorized, isNetworkOnline, refetchQueueStatus]);

  useQueuePolling({
    step,
    activeEventId,
    isNetworkOnline,
    waitingError,
    queuePosition: waitingQueuePosition,
    setStep,
    setQueueStatus,
    setWaitingError,
    setWaitingPolling,
    setIsNetworkOnline,
    checkQueueStatus,
  });

  const handleEnterQueue = useCallback(async (event: { id: string; title: string; eventDate?: string }) => {
    if (!acquireSingleFlight(enterLockRef)) {
      return;
    }
    if (!isNetworkOnline) {
      releaseSingleFlight(enterLockRef);
      setListNotice("인터넷 연결을 확인한 뒤 다시 시도해주세요.");
      return;
    }

    setActiveEventId(event.id);
    setActiveEventTitle(event.title);
    setActiveEventDate(event.eventDate ?? "");
    setListNotice(null);
    setWaitingError(null);
    setWaitingQueuePosition(null);
    setWaitingQueuePositionUpdatedAt(null);
    resetReservationAgreement();
    setQueueStatus("WAITING");
    applyQueueEventToUrl(event.id);

    try {
      const enterResponse = await enterQueueMutation.mutateAsync(event.id);
      await handleQueueStatus(
        enterResponse.status,
        event.id,
        enterResponse.queuePosition,
        "enter",
      );
    } catch (error) {
      const parsed = parseApiError(error);
      if (parsed.status === 401 || parsed.code === "UNAUTHORIZED") {
        handleUnauthorized();
      } else {
        setActiveEventId(null);
        setListNotice("대기열 진입에 실패했습니다. 잠시 후 다시 시도해주세요.");
        applyQueueEventToUrl(null);
        await moveToList({ preserveNotice: true });
      }
    } finally {
      releaseSingleFlight(enterLockRef);
    }
  }, [
    applyQueueEventToUrl,
    enterQueueMutation,
    enterLockRef,
    handleQueueStatus,
    handleUnauthorized,
    isNetworkOnline,
    moveToList,
    resetReservationAgreement,
  ]);

  const handleAgreementCheckedChange = useCallback((checked: boolean) => {
    setAgreementChecked(checked);
    if (reservationError) {
      setReservationError(null);
    }
  }, [reservationError]);

  const handleSubmitReservation = useCallback(() => {
    if (!activeEventId) {
      return;
    }

    if (!agreementChecked) {
      setReservationError("위 사항을 숙지하신 후 체크해주세요.");
      return;
    }

    setReservationError(null);
    void executeReserve(activeEventId);
  }, [activeEventId, agreementChecked, executeReserve]);

  useEffect(() => {
    if (step !== "list") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [step]);

  const backToList = useCallback(() => {
    setActiveEventId(null);
    setActiveEventTitle("");
    setActiveEventDate("");
    setQueueStatus("NONE");
    setWaitingQueuePosition(null);
    setWaitingQueuePositionUpdatedAt(null);
    setWaitingError(null);
    setWaitingPolling(false);
    setSoldOutDescription(DEFAULT_SOLD_OUT_DESCRIPTION);
    setReserveProcessing(false);
    setReserveErrorMessage(null);
    setReserveMessage("입장 상태가 확인되어 예매를 진행하고 있습니다.");
    setAgreementChecked(false);
    setReservationError(null);
    applyQueueEventToUrl(null);
    void moveToList();
  }, [applyQueueEventToUrl, moveToList]);

  const openList = useCallback(() => {
    navigate("/ticket/ticketing?list=1");
    backToList();
  }, [backToList, navigate]);

  const refreshList = useCallback(() => {
    setListNotice(null);
    void eventsQuery.refetch();
  }, [eventsQuery]);

  const openMyTickets = useCallback(() => {
    navigate("/ticket/my-ticket");
  }, [navigate]);

  const retryReserve = useCallback(() => {
    if (!activeEventId) {
      return;
    }
    void executeReserve(activeEventId);
  }, [activeEventId, executeReserve]);

  return {
    step,
    events,
    listLoading,
    listErrorMessage,
    now,
    activeEventTitle,
    activeEventDate,
    waitingAd: waitingAdQuery.data ?? null,
    waitingQueuePosition,
    waitingQueuePositionUpdatedAt,
    waitingPolling,
    isNetworkOnline,
    waitingError,
    agreementChecked,
    reserveProcessing,
    reservationError,
    reserveMessage,
    reserveErrorMessage,
    soldOutDescription,
    openList,
    refreshList,
    openMyTickets,
    selectEvent: handleEnterQueue,
    changeAgreement: handleAgreementCheckedChange,
    submitReservation: handleSubmitReservation,
    retryReserve,
    backToList,
  };
}
