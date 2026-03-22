// 역할: 티켓팅 도메인 상태/비동기 흐름을 관리하는 React Hook 모듈입니다.
import type { QueueRequestStatus } from "@/types/ticketing/model/ticket.model";

export const FOREGROUND_POLL_INTERVAL = 2000;
export const BACKGROUND_POLL_INTERVAL = 8000;
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
