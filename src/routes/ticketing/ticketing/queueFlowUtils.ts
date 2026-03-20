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
