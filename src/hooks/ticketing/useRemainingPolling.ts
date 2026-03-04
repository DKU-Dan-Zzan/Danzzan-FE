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
  onSoldOutRef.current = onSoldOut;

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

    // 즉시 한 번 조회
    void fetchRemaining();

    const intervalId = window.setInterval(() => {
      void fetchRemaining();
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [enabled, eventId, intervalMs, fetchRemaining]);

  return { remaining };
};
