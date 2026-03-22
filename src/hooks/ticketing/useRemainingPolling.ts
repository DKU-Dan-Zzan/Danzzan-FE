// 역할: 남은 시간/순번 기반 폴링 주기를 계산하고 갱신하는 훅 로직을 제공합니다.
import { useCallback, useEffect, useRef, useState } from "react";
import { ticketApi } from "@/api/ticketing/ticketApi";

interface UseRemainingPollingOptions {
  eventId: string | null;
  enabled: boolean;
  intervalMs?: number;
  onSoldOut?: () => void;
}

export const useRemainingPolling = ({
  eventId,
  enabled,
  intervalMs = 2000,
  onSoldOut,
}: UseRemainingPollingOptions) => {
  const [remaining, setRemaining] = useState<number | null>(null);
  const onSoldOutRef = useRef(onSoldOut);

  useEffect(() => {
    onSoldOutRef.current = onSoldOut;
  }, [onSoldOut]);

  const fetchRemaining = useCallback(async () => {
    if (!eventId) return;
    try {
      const data = await ticketApi.getRemainingCount(eventId);
      setRemaining(data.remaining);
      if (data.remaining <= 0) {
        onSoldOutRef.current?.();
      }
    } catch {
      // 폴링 실패는 무시 (다음 주기에 재시도)
    }
  }, [eventId]);

  useEffect(() => {
    if (!enabled || !eventId) {
      return;
    }

    const runFetch = () => {
      void fetchRemaining();
    };

    // 마운트 직후 1회 조회
    const initialTimeoutId = window.setTimeout(runFetch, 0);

    const intervalId = window.setInterval(() => {
      runFetch();
    }, intervalMs);

    return () => {
      window.clearTimeout(initialTimeoutId);
      window.clearInterval(intervalId);
    };
  }, [enabled, eventId, intervalMs, fetchRemaining]);

  return { remaining };
};
