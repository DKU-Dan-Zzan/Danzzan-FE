import { describe, expect, it } from "vitest";
import { HttpError } from "@/api/common/httpClient";
import { normalizeAppError } from "@/lib/error/appError";

describe("normalizeAppError", () => {
  it("일반 Error를 기본 AppError로 변환한다", () => {
    const actual = normalizeAppError(new Error("테스트 오류"));

    expect(actual.status).toBeNull();
    expect(actual.code).toBeNull();
    expect(actual.message).toBe("테스트 오류");
    expect(actual.retriable).toBe(true);
  });

  it("HttpError payload에서 code를 추출한다", () => {
    const error = new HttpError("요청 실패", 409, { code: "CONFLICT" });
    const actual = normalizeAppError(error);

    expect(actual.status).toBe(409);
    expect(actual.code).toBe("CONFLICT");
    expect(actual.retriable).toBe(false);
  });

  it("AbortError는 재시도 불가로 처리한다", () => {
    const abortError = new DOMException("The operation was aborted.", "AbortError");
    const actual = normalizeAppError(abortError);

    expect(actual.code).toBe("ABORTED");
    expect(actual.retriable).toBe(false);
  });

  it("5xx 오류는 재시도 가능으로 처리한다", () => {
    const error = new HttpError("서버 오류", 503, { errorCode: "SERVER_ERROR" });
    const actual = normalizeAppError(error);

    expect(actual.status).toBe(503);
    expect(actual.code).toBe("SERVER_ERROR");
    expect(actual.retriable).toBe(true);
  });
});
