// 역할: 티켓팅 플로우에서 대기열 이벤트 해석/상태 계산을 보조하는 유틸을 제공합니다.
export {
  BACKGROUND_POLL_INTERVAL,
  FOREGROUND_POLL_INTERVAL,
  MAX_BACKOFF_EXPONENT,
  MAX_POLL_DELAY_MS,
  MIN_POLL_DELAY_MS,
  POLL_JITTER_MS,
  REMAINING_STALE_MS,
  acquireSingleFlight,
  computePollingDelay,
  isRemainingFresh,
  readQueueEventIdFromSearch,
  releaseSingleFlight,
  resolveQueueStatusAction,
} from "@/hooks/ticketing/queue/flow-utils";

export type {
  QueueStatusAction,
  SingleFlightLockLike,
} from "@/hooks/ticketing/queue/flow-utils";
