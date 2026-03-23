// 역할: useAdminAuth 로그인 에러 메시지 매핑 규칙을 검증합니다.

import { describe, expect, it } from "vitest";
import { HttpError } from "@/api/common/httpClient";
import { resolveAdminLoginErrorMessage } from "@/hooks/app/admin/useAdminAuth";

describe("resolveAdminLoginErrorMessage", () => {
  it("401 에러는 학번/비밀번호 오류 안내 문구로 변환한다", () => {
    const message = resolveAdminLoginErrorMessage(
      new HttpError("Request failed with status 401", 401),
    );

    expect(message).toBe("학번 또는 비밀번호가 올바르지 않습니다.");
  });

  it("명시적인 에러 메시지는 그대로 노출한다", () => {
    const message = resolveAdminLoginErrorMessage(new Error("로그인에 실패했습니다."));

    expect(message).toBe("로그인에 실패했습니다.");
  });
});
