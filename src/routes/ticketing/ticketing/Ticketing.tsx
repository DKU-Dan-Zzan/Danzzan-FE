import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { adApi } from "@/api/ticketing/adApi";
import { HttpError } from "@/api/ticketing/httpClient";
import { ticketApi } from "@/api/ticketing/ticketApi";
import { ReservationAlreadyPanel } from "@/components/ticketing/panels/ReservationAlreadyPanel";
import { ReservationProcessingPanel } from "@/components/ticketing/panels/ReservationProcessingPanel";
import { ReservationSoldOutPanel } from "@/components/ticketing/panels/ReservationSoldOutPanel";
import { ReservationSuccessPanel } from "@/components/ticketing/panels/ReservationSuccessPanel";
import { TicketingEventListPanel } from "@/components/ticketing/panels/TicketingEventListPanel";
import { TicketingHomePanel } from "@/components/ticketing/panels/TicketingHomePanel";
import { TicketingReservationPanel } from "@/components/ticketing/panels/TicketingReservationPanel";
import { WaitingRoomPanel } from "@/components/ticketing/panels/WaitingRoomPanel";
import { useTicketing } from "@/hooks/ticketing/useTicketing";
import {
  BACKGROUND_POLL_INTERVAL,
  FOREGROUND_POLL_INTERVAL,
  MAX_BACKOFF_EXPONENT,
  acquireSingleFlight,
  computePollingDelay,
  readQueueEventIdFromSearch,
  releaseSingleFlight,
  resolveQueueStatusAction,
} from "@/hooks/ticketing/queue/flow-utils";
import type { PlacementAd } from "@/types/ticketing/model/ad.model";
import type { QueueRequestStatus, ReserveErrorCode, TicketingEvent } from "@/types/ticketing/model/ticket.model";

type TicketingStep = "home" | "list" | "waiting" | "in-progress" | "reserving" | "soldout" | "already" | "success";

interface ParsedApiError {
  status: number | null;
  code: string | null;
}

const OFFLINE_WAITING_MESSAGE = "인터넷 연결이 끊겼습니다. 연결이 복구되면 자동으로 다시 확인합니다.";
const DEFAULT_SOLD_OUT_DESCRIPTION = "다른 티켓팅 일정은 티켓팅 목록에서 확인하실 수 있어요.";
const QUEUE_WAITING_SOLD_OUT_DESCRIPTION = "현재 순서 이전에 티켓이 모두 소진되었습니다.";

const RESERVE_ERROR_CODE_SET = new Set<ReserveErrorCode>([
  "RESERVE_ALREADY_RESERVED",
  "RESERVE_SOLD_OUT",
  "RESERVE_NOT_OPEN",
  "EVENT_NOT_FOUND",
  "UNAUTHORIZED",
  "TEMPORARY_ERROR",
]);

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
};

const parseApiError = (error: unknown): ParsedApiError => {
  if (!(error instanceof HttpError)) {
    return {
      status: null,
      code: null,
    };
  }

  const payloadRecord = toRecord(error.payload);
  const payloadError = toRecord(payloadRecord?.error);
  const payloadData = toRecord(payloadRecord?.data);
  const rawCode =
    payloadRecord?.errorCode ??
    payloadRecord?.code ??
    payloadError?.errorCode ??
    payloadError?.code ??
    payloadError?.error ??
    payloadData?.errorCode ??
    payloadData?.code ??
    null;
  const parsedCode = typeof rawCode === "string" && rawCode.trim() ? rawCode.trim() : null;

  return {
    status: typeof error.status === "number" ? error.status : null,
    code: parsedCode,
  };
};

const asReserveErrorCode = (value: string | null): ReserveErrorCode | null => {
  if (!value || !RESERVE_ERROR_CODE_SET.has(value as ReserveErrorCode)) {
    return null;
  }
  return value as ReserveErrorCode;
};

export default function Ticketing() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    loading: listLoading,
    error: listError,
    clearError,
    getTicketingEvents,
  } = useTicketing();

  const [step, setStep] = useState<TicketingStep>("home");
  const [events, setEvents] = useState<TicketingEvent[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [activeEventId, setActiveEventId] = useState<string | null>(() => readQueueEventIdFromSearch(window.location.search));
  const [activeEventTitle, setActiveEventTitle] = useState("");

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

  const [waitingAd, setWaitingAd] = useState<PlacementAd | null>(null);
  const [soldOutDescription, setSoldOutDescription] = useState(DEFAULT_SOLD_OUT_DESCRIPTION);

  const enterLockRef = useRef(false);
  const reserveLockRef = useRef(false);
  const pollBackoffRef = useRef(0);
  const restoreAttemptedRef = useRef(false);
  const adLoadedRef = useRef(false);
  const wasOnlineRef = useRef(isNetworkOnline);

  const listErrorMessage = useMemo(() => {
    if (listNotice) {
      return listNotice;
    }
    return listError?.message ?? null;
  }, [listNotice, listError?.message]);

  const queueEventFromSearch = useMemo(
    () => readQueueEventIdFromSearch(location.search),
    [location.search],
  );

  const applyQueueEventToUrl = useCallback((eventId: string | null) => {
    const params = new URLSearchParams(location.search);
    if (eventId) {
      params.set("eventId", eventId);
    } else {
      params.delete("eventId");
    }
    const nextSearch = params.toString();
    const currentSearch = location.search.startsWith("?")
      ? location.search.slice(1)
      : location.search;
    if (nextSearch === currentSearch) {
      return;
    }

    navigate(
      {
        pathname: "/ticket/ticketing",
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [location.search, navigate]);

  const handleUnauthorized = useCallback(() => {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    navigate(`/ticket/login?redirect=${redirect}`, { replace: true });
  }, [location.pathname, location.search, navigate]);

  const loadEvents = useCallback(async (): Promise<TicketingEvent[]> => {
    const fetched = await getTicketingEvents();
    setEvents(fetched);
    if (activeEventId) {
      const matched = fetched.find((event) => event.id === activeEventId);
      if (matched) {
        setActiveEventTitle(matched.title);
      }
    }
    return fetched;
  }, [activeEventId, getTicketingEvents]);

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

  const updateWaitingQueuePosition = useCallback((queuePosition: number | null) => {
    setWaitingQueuePosition(queuePosition);
    setWaitingQueuePositionUpdatedAt(Date.now());
  }, []);

  const moveToList = useCallback(async (options?: { preserveNotice?: boolean }) => {
    setStep("list");
    if (!options?.preserveNotice) {
      setListNotice(null);
    }
    clearError();
    await loadEvents();
  }, [clearError, loadEvents]);

  const applyReserveError = useCallback(async (
    eventId: string,
    parsedError: ParsedApiError,
  ) => {
    const reserveCode = asReserveErrorCode(parsedError.code);
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
      // 상태 확인 동기화를 위해 내 티켓 화면에서 최신 정보를 확인하도록 유도합니다.
      void ticketApi.getMyTickets().catch(() => null);
    }

    if (reserveCode !== "RESERVE_NOT_OPEN" && reserveCode !== "TEMPORARY_ERROR") {
      applyQueueEventToUrl(null);
    } else {
      applyQueueEventToUrl(eventId);
    }
  }, [applyQueueEventToUrl, handleUnauthorized, moveToList]);

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
      await ticketApi.activateTicket(eventId);
      await ticketApi.reserveTicket(eventId);
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
  }, [applyQueueEventToUrl, applyReserveError]);

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
        setAgreementChecked(false);
        setReservationError(null);
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
  }, [applyQueueEventToUrl, moveToList, updateWaitingQueuePosition]);

  const checkQueueStatus = useCallback(async (
    eventId: string,
    signal?: AbortSignal,
  ): Promise<QueueRequestStatus | null> => {
    if (!isNetworkOnline) {
      setWaitingPolling(false);
      setWaitingError(OFFLINE_WAITING_MESSAGE);
      return null;
    }

    try {
      const statusResponse = await ticketApi.getTicketQueueStatus(eventId, signal);
      setWaitingError(null);
      pollBackoffRef.current = 0;
      await handleQueueStatus(
        statusResponse.status,
        eventId,
        statusResponse.queuePosition,
        "poll",
      );
      return statusResponse.status;
    } catch (error) {
      if (signal?.aborted) {
        return null;
      }

      const parsed = parseApiError(error);
      if (parsed.status === 401 || parsed.code === "UNAUTHORIZED") {
        handleUnauthorized();
        return null;
      }

      setWaitingError("네트워크 상태가 불안정합니다. 잠시 후 자동으로 다시 확인합니다.");
      return null;
    }
  }, [handleQueueStatus, handleUnauthorized, isNetworkOnline]);

  const handleEnterQueue = useCallback(async (event: TicketingEvent) => {
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
    setListNotice(null);
    setWaitingError(null);
    setWaitingQueuePosition(null);
    setWaitingQueuePositionUpdatedAt(null);
    setAgreementChecked(false);
    setReservationError(null);
    setQueueStatus("WAITING");
    applyQueueEventToUrl(event.id);

    try {
      const enterResponse = await ticketApi.enterTicketQueue(event.id);
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
  }, [applyQueueEventToUrl, handleQueueStatus, handleUnauthorized, isNetworkOnline, moveToList]);

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

  useEffect(() => {
    const handleOnline = () => {
      setIsNetworkOnline(true);
    };
    const handleOffline = () => {
      setIsNetworkOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (step !== "waiting") {
      return;
    }

    if (!isNetworkOnline) {
      setWaitingPolling(false);
      setWaitingError(OFFLINE_WAITING_MESSAGE);
      return;
    }

    if (waitingError === OFFLINE_WAITING_MESSAGE) {
      setWaitingError(null);
    }
  }, [isNetworkOnline, step, waitingError]);

  useEffect(() => {
    if (activeEventId === queueEventFromSearch) {
      return;
    }
    setActiveEventId(queueEventFromSearch);
  }, [activeEventId, queueEventFromSearch]);

  useEffect(() => {
    const state = location.state as { resetToHome?: number } | null;
    if (!state?.resetToHome) {
      return;
    }

    resetQueueFlowState();
    setActiveEventId(null);
    setActiveEventTitle("");
    setListNotice(null);
    setStep("home");
    clearError();
    applyQueueEventToUrl(null);
  }, [applyQueueEventToUrl, clearError, location.state, resetQueueFlowState]);

  useEffect(() => {
    if (restoreAttemptedRef.current) {
      return;
    }
    restoreAttemptedRef.current = true;

    if (!activeEventId) {
      return;
    }

    if (!isNetworkOnline) {
      setQueueStatus("WAITING");
      setWaitingError(OFFLINE_WAITING_MESSAGE);
      setWaitingPolling(false);
      return;
    }

    setStep("waiting");
    const controller = new AbortController();
    setWaitingPolling(true);

    void (async () => {
      try {
        const statusResponse = await ticketApi.getTicketQueueStatus(activeEventId, controller.signal);
        await handleQueueStatus(statusResponse.status, activeEventId, statusResponse.queuePosition);
      } catch (error) {
        const parsed = parseApiError(error);
        if (parsed.status === 401 || parsed.code === "UNAUTHORIZED") {
          handleUnauthorized();
          return;
        }
        setQueueStatus("WAITING");
        setWaitingError("대기 상태를 확인하지 못했습니다. 새로고침 후 다시 시도해주세요.");
      } finally {
        setWaitingPolling(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [activeEventId, handleQueueStatus, handleUnauthorized, isNetworkOnline]);

  useEffect(() => {
    const wasOnline = wasOnlineRef.current;
    wasOnlineRef.current = isNetworkOnline;

    if (wasOnline || !isNetworkOnline || step !== "waiting" || !activeEventId) {
      return;
    }

    setWaitingError(null);
    setWaitingPolling(true);
    void checkQueueStatus(activeEventId).finally(() => {
      setWaitingPolling(false);
    });
  }, [activeEventId, checkQueueStatus, isNetworkOnline, step]);

  useEffect(() => {
    if (step !== "waiting" || !activeEventId || !isNetworkOnline) {
      return;
    }

    let cancelled = false;
    let timerId: number | null = null;
    let currentController: AbortController | null = null;

    const scheduleNextPoll = (delay: number) => {
      if (cancelled) {
        return;
      }
      timerId = window.setTimeout(() => {
        void runPoll();
      }, delay);
    };

    const runPoll = async () => {
      if (cancelled) {
        return;
      }

      currentController?.abort();
      currentController = new AbortController();
      setWaitingPolling(true);

      const status = await checkQueueStatus(activeEventId, currentController.signal);

      if (cancelled) {
        return;
      }

      if (status === "WAITING" || status === null) {
        const baseDelay = document.hidden ? BACKGROUND_POLL_INTERVAL : FOREGROUND_POLL_INTERVAL;
        if (status === null) {
          pollBackoffRef.current = Math.min(pollBackoffRef.current + 1, MAX_BACKOFF_EXPONENT);
        } else {
          pollBackoffRef.current = 0;
        }
        const delay = computePollingDelay(baseDelay, pollBackoffRef.current);
        scheduleNextPoll(delay);
      }
    };

    scheduleNextPoll(computePollingDelay(FOREGROUND_POLL_INTERVAL, 0));

    return () => {
      cancelled = true;
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
      currentController?.abort();
      setWaitingPolling(false);
      pollBackoffRef.current = 0;
    };
  }, [activeEventId, checkQueueStatus, isNetworkOnline, step]);

  useEffect(() => {
    if (step !== "waiting" || adLoadedRef.current) {
      return;
    }

    adLoadedRef.current = true;
    const controller = new AbortController();

    void adApi
      .getPlacementAd("WAITING_ROOM_MAIN", controller.signal)
      .then((ad) => {
        setWaitingAd(ad);
      })
      .catch(() => {
        setWaitingAd(null);
      });

    return () => {
      controller.abort();
    };
  }, [step]);

  const openList = useCallback(async () => {
    setActiveEventId(null);
    setActiveEventTitle("");
    resetQueueFlowState();
    applyQueueEventToUrl(null);
    await moveToList();
  }, [applyQueueEventToUrl, moveToList, resetQueueFlowState]);

  if (step === "home") {
    return (
      <TicketingHomePanel
        onOpenTicketingList={() => {
          void openList();
        }}
        onOpenMyTickets={() => navigate("/ticket/my-ticket")}
      />
    );
  }

  if (step === "list") {
    return (
      <TicketingEventListPanel
        events={events}
        loading={listLoading}
        errorMessage={listErrorMessage}
        now={now}
        onRefresh={() => {
          setListNotice(null);
          void loadEvents();
        }}
        onSelectEvent={handleEnterQueue}
      />
    );
  }

  if (step === "waiting") {
    return (
      <WaitingRoomPanel
        eventTitle={activeEventTitle}
        queuePosition={waitingQueuePosition}
        queuePositionUpdatedAt={waitingQueuePositionUpdatedAt}
        polling={waitingPolling}
        offline={!isNetworkOnline}
        errorMessage={waitingError}
        ad={waitingAd}
      />
    );
  }

  if (step === "in-progress") {
    return (
      <TicketingReservationPanel
        eventTitle={activeEventTitle}
        agreementChecked={agreementChecked}
        submitting={reserveProcessing}
        errorMessage={reservationError}
        onAgreementCheckedChange={handleAgreementCheckedChange}
        onSubmit={handleSubmitReservation}
      />
    );
  }

  if (step === "reserving") {
    return (
      <ReservationProcessingPanel
        processing={reserveProcessing}
        message={reserveMessage}
        errorMessage={reserveErrorMessage}
        onRetry={() => {
          if (!activeEventId) {
            return;
          }
          void executeReserve(activeEventId);
        }}
        onBackToList={() => {
          setActiveEventId(null);
          setActiveEventTitle("");
          resetQueueFlowState();
          applyQueueEventToUrl(null);
          void moveToList();
        }}
      />
    );
  }

  if (step === "soldout") {
    return (
      <ReservationSoldOutPanel
        description={soldOutDescription}
        onBackToList={() => {
          setActiveEventId(null);
          setActiveEventTitle("");
          resetQueueFlowState();
          applyQueueEventToUrl(null);
          void moveToList();
        }}
      />
    );
  }

  if (step === "already") {
    return (
      <ReservationAlreadyPanel
        onGoMyTickets={() => navigate("/ticket/my-ticket")}
        onBackToList={() => {
          setActiveEventId(null);
          setActiveEventTitle("");
          resetQueueFlowState();
          applyQueueEventToUrl(null);
          void moveToList();
        }}
      />
    );
  }

  return (
    <ReservationSuccessPanel
      onGoMyTickets={() => navigate("/ticket/my-ticket")}
    />
  );
}
