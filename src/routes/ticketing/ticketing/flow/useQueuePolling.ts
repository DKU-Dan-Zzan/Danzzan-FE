// 역할: 티켓팅 대기열 폴링 주기·온라인복구·백오프 재시도 사이드이펙트를 관리합니다.
import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import {
  BACKGROUND_POLL_INTERVAL,
  MAX_BACKOFF_EXPONENT,
  computePollingDelay,
  getAdaptiveForegroundInterval,
} from "@/hooks/ticketing/queue/flow-utils";
import { OFFLINE_WAITING_MESSAGE } from "@/routes/ticketing/ticketing/ticketing-flow-helpers";
import type { TicketingStep } from "@/routes/ticketing/ticketing/flow/types";
import type { QueueRequestStatus } from "@/types/ticketing/model/ticket.model";

type UseQueuePollingParams = {
  step: TicketingStep;
  activeEventId: string | null;
  isNetworkOnline: boolean;
  waitingError: string | null;
  queuePosition: number | null;
  setStep: Dispatch<SetStateAction<TicketingStep>>;
  setQueueStatus: (status: QueueRequestStatus) => void;
  setWaitingError: Dispatch<SetStateAction<string | null>>;
  setWaitingPolling: Dispatch<SetStateAction<boolean>>;
  setIsNetworkOnline: Dispatch<SetStateAction<boolean>>;
  checkQueueStatus: (eventId: string) => Promise<QueueRequestStatus | null>;
};

export const useQueuePolling = ({
  step,
  activeEventId,
  isNetworkOnline,
  waitingError,
  queuePosition,
  setStep,
  setQueueStatus,
  setWaitingError,
  setWaitingPolling,
  setIsNetworkOnline,
  checkQueueStatus,
}: UseQueuePollingParams) => {
  const pollBackoffRef = useRef(0);
  const queuePositionRef = useRef(queuePosition);
  const restoreAttemptedRef = useRef(false);
  const wasOnlineRef = useRef(isNetworkOnline);

  useEffect(() => {
    queuePositionRef.current = queuePosition;
  }, [queuePosition]);

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
  }, [setIsNetworkOnline]);

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
  }, [isNetworkOnline, setWaitingError, setWaitingPolling, step, waitingError]);

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
    setWaitingPolling(true);
    void checkQueueStatus(activeEventId).finally(() => {
      setWaitingPolling(false);
    });
  }, [
    activeEventId,
    checkQueueStatus,
    isNetworkOnline,
    setQueueStatus,
    setStep,
    setWaitingError,
    setWaitingPolling,
  ]);

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
  }, [
    activeEventId,
    checkQueueStatus,
    isNetworkOnline,
    setWaitingError,
    setWaitingPolling,
    step,
  ]);

  useEffect(() => {
    if (step !== "waiting" || !activeEventId || !isNetworkOnline) {
      return;
    }

    let cancelled = false;
    let timerId: number | null = null;

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

      setWaitingPolling(true);
      const status = await checkQueueStatus(activeEventId);

      if (cancelled) {
        return;
      }

      if (status === "WAITING" || status === null) {
        const baseDelay = document.hidden
          ? BACKGROUND_POLL_INTERVAL
          : getAdaptiveForegroundInterval(queuePositionRef.current);
        if (status === null) {
          pollBackoffRef.current = Math.min(pollBackoffRef.current + 1, MAX_BACKOFF_EXPONENT);
        } else {
          pollBackoffRef.current = 0;
        }
        scheduleNextPoll(computePollingDelay(baseDelay, pollBackoffRef.current));
      }
    };

    scheduleNextPoll(computePollingDelay(getAdaptiveForegroundInterval(queuePositionRef.current), 0));

    return () => {
      cancelled = true;
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
      setWaitingPolling(false);
      pollBackoffRef.current = 0;
    };
  }, [activeEventId, checkQueueStatus, isNetworkOnline, setWaitingPolling, step]);
};
