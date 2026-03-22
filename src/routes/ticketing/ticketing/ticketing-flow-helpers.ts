// 역할: 티켓팅 도메인 라우트와 화면 흐름을 구성하는 모듈입니다.
import { HttpError } from "@/api/ticketing/httpClient";
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

export const parseApiError = (error: unknown): ParsedApiError => {
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

export const asReserveErrorCode = (value: string | null): ReserveErrorCode | null => {
  if (!value || !RESERVE_ERROR_CODE_SET.has(value as ReserveErrorCode)) {
    return null;
  }
  return value as ReserveErrorCode;
};
