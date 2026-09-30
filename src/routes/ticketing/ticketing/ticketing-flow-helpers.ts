// 역할: 티켓팅 플로우 훅에서 재사용하는 파생 상태/오류 처리 헬퍼를 제공합니다.
import { normalizeAppError } from "@/lib/error/appError";
import type { ReserveErrorCode } from "@/types/ticketing/model/ticket.model";

export type ParsedApiError = {
  status: number | null;
  code: string | null;
};

export const OFFLINE_WAITING_MESSAGE =
  "인터넷 연결이 끊겼습니다. 연결이 복구되면 자동으로 다시 확인합니다.";
export const DEFAULT_SOLD_OUT_DESCRIPTION =
  "다른 티켓팅 일정은 티켓팅 목록에서 확인하실 수 있어요.";
export const QUEUE_WAITING_SOLD_OUT_DESCRIPTION =
  "현재 순서 이전에 티켓이 모두 소진되었습니다.";

const RESERVE_ERROR_CODE_SET = new Set<ReserveErrorCode>([
  "RESERVE_ALREADY_RESERVED",
  "RESERVE_SOLD_OUT",
  "RESERVE_NOT_OPEN",
  "RESERVE_ADMISSION_EXPIRED",
  "RESERVE_PROCESSING_PENDING",
  "EVENT_NOT_FOUND",
  "UNAUTHORIZED",
  "TEMPORARY_ERROR",
]);

export const parseApiError = (error: unknown): ParsedApiError => {
  const { status, code } = normalizeAppError(error);
  return { status, code };
};

export const asReserveErrorCode = (value: string | null): ReserveErrorCode | null => {
  if (!value || !RESERVE_ERROR_CODE_SET.has(value as ReserveErrorCode)) {
    return null;
  }
  return value as ReserveErrorCode;
};
