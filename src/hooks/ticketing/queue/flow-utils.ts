// 역할: 티켓팅 대기열 상태머신에서 사용하는 재시도/백오프/상태 판별 유틸을 제공합니다.
import type { QueueRequestStatus } from "@/types/ticketing/model/ticket.model";

export const FOREGROUND_POLL_INTERVAL = 2000;
export const BACKGROUND_POLL_INTERVAL = 8000;

/**
 * 순번 기반 적응형 폴링 간격
 * - 1~100번:    2s  (곧 내 차례, 빠르게 감지)
 * - 101~1000번: 5s  (어느 정도 여유)
 * - 1001번~:    10s (한참 기다려야 함)
 */
export const getAdaptiveForegroundInterval = (queuePosition: number | null): number => {
  if (queuePosition === null) return FOREGROUND_POLL_INTERVAL;
  if (queuePosition <= 100) return 2000;
  if (queuePosition <= 1000) return 5000;
  return 10000;
};
export const MAX_BACKOFF_EXPONENT = 4;
export const MAX_POLL_DELAY_MS = 60_000;
export const MIN_POLL_DELAY_MS = 700;
export const POLL_JITTER_MS = 320;
export const REMAINING_STALE_MS = 15_000;

export type QueueStatusAction =
  | "waiting"
  | "reserve"
  | "soldout"
  | "already"
  | "list";

export const resolveQueueStatusAction = (status: QueueRequestStatus): QueueStatusAction => {
  switch (status) {
    case "WAITING":
      return "waiting";
    case "ADMITTED":
      return "reserve";
    case "SUCCESS":
      return "already";
    case "SOLD_OUT":
      return "soldout";
    case "ALREADY":
      return "already";
    case "NONE":
    default:
      return "list";
  }
};

export const readQueueEventIdFromSearch = (search: string): string | null => {
  const params = new URLSearchParams(search);
  const eventId = params.get("eventId");
  return eventId?.trim() || null;
};

export interface SingleFlightLockLike {
  current: boolean;
}

export const acquireSingleFlight = (lock: SingleFlightLockLike): boolean => {
  if (lock.current) {
    return false;
  }
  lock.current = true;
  return true;
};

export const releaseSingleFlight = (lock: SingleFlightLockLike): void => {
  lock.current = false;
};

export const computePollingDelay = (
  baseDelayMs: number,
  backoffExponent: number,
  randomFn: () => number = Math.random,
): number => {
  const backoffApplied = Math.min(
    Math.round(baseDelayMs * 2 ** backoffExponent),
    MAX_POLL_DELAY_MS,
  );
  const jitter = Math.round((randomFn() * 2 - 1) * POLL_JITTER_MS);

  return Math.max(MIN_POLL_DELAY_MS, backoffApplied + jitter);
};

export const isRemainingFresh = (
  remainingUpdatedAt: number | null,
  now: number,
  staleThresholdMs = REMAINING_STALE_MS,
): boolean => {
  if (remainingUpdatedAt === null) {
    return false;
  }

  return now - remainingUpdatedAt <= staleThresholdMs;
};
