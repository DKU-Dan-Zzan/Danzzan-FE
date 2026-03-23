// 역할: API/도메인 오류를 화면 친화 메시지로 표준화하는 에러 모델을 정의한다.

import axios from "axios";
import { HttpError } from "@/api/common/httpClient";
import { getErrorStatus } from "@/api/common/fetchAuth";

export type AppError = {
  status: number | null;
  code: string | null;
  message: string;
  retriable: boolean;
  cause?: unknown;
};

const ABORTED_CODE = "ABORTED";
const ABORTED_MESSAGE = "요청이 취소되었습니다.";

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
};

const toStringOrNull = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return null;
};

const readCodeFromPayload = (payload: unknown): string | null => {
  const record = asRecord(payload);
  if (!record) {
    return null;
  }

  const nestedError = asRecord(record.error);
  const nestedData = asRecord(record.data);

  return (
    toStringOrNull(record.errorCode) ??
    toStringOrNull(record.code) ??
    toStringOrNull(record.error) ??
    toStringOrNull(nestedError?.errorCode) ??
    toStringOrNull(nestedError?.code) ??
    toStringOrNull(nestedError?.error) ??
    toStringOrNull(nestedData?.errorCode) ??
    toStringOrNull(nestedData?.code) ??
    null
  );
};

const readMessage = (error: unknown): string => {
  if (error instanceof HttpError) {
    return error.message || "요청 처리에 실패했습니다.";
  }

  if (axios.isAxiosError(error)) {
    const payload = asRecord(error.response?.data);
    return (
      toStringOrNull(payload?.message) ??
      toStringOrNull(payload?.error) ??
      error.message ??
      "요청 처리에 실패했습니다."
    );
  }

  if (error instanceof Error) {
    return error.message || "요청 처리에 실패했습니다.";
  }

  return "요청 처리에 실패했습니다.";
};

const isAbortLikeError = (error: unknown): boolean => {
  if (!error) {
    return false;
  }

  if (axios.isAxiosError(error)) {
    return error.code === "ERR_CANCELED";
  }

  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }

  if (error instanceof Error) {
    return error.name === "AbortError" || error.name === "CanceledError";
  }

  return false;
};

const isRetriableStatus = (status: number | null): boolean => {
  if (status === null) {
    return true;
  }
  return status >= 500 || status === 429;
};

export const normalizeAppError = (error: unknown): AppError => {
  if (isAbortLikeError(error)) {
    return {
      status: null,
      code: ABORTED_CODE,
      message: ABORTED_MESSAGE,
      retriable: false,
      cause: error,
    };
  }

  let status: number | null = null;
  let code: string | null = null;

  if (error instanceof HttpError) {
    status = error.status;
    code = readCodeFromPayload(error.payload);
  } else if (axios.isAxiosError(error)) {
    status = error.response?.status ?? null;
    code = readCodeFromPayload(error.response?.data);
  } else {
    status = getErrorStatus(error);
    code = readCodeFromPayload(error);
  }

  return {
    status,
    code,
    message: readMessage(error),
    retriable: isRetriableStatus(status),
    cause: error,
  };
};
