// 역할: 애플리케이션 전역 QueryClient 기본 정책을 구성한다.

import { QueryClient } from "@tanstack/react-query";
import { normalizeAppError } from "@/lib/error/appError";

const DEFAULT_STALE_TIME = 60_000;
const DEFAULT_GC_TIME = 10 * 60_000;
const MAX_ATTEMPTS = 2;

export const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
  const appError = normalizeAppError(error);
  if (!appError.retriable) {
    return false;
  }
  return failureCount < MAX_ATTEMPTS;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME,
      gcTime: DEFAULT_GC_TIME,
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
