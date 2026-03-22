// 역할: 인증 DTO→도메인 매핑 결과가 계약에 맞는지 검증하는 테스트입니다.
import { describe, expect, it } from "vitest";
import { mapAuthLoginResponse } from "@/lib/ticketing/mappers/authMapper";

describe("authMapper", () => {
  it("평문 로그인 응답에서 토큰/유저 정보를 매핑한다", () => {
    const session = mapAuthLoginResponse({
      accessToken: "plain-access",
      refreshToken: "plain-refresh",
      user: {
        id: "1",
        name: "단짠",
        role: "student",
        studentId: "20201234",
        department: "소프트웨어학과",
        college: "공과대학",
      },
    });

    expect(session.tokens.accessToken).toBe("plain-access");
    expect(session.tokens.refreshToken).toBe("plain-refresh");
    expect(session.user?.role).toBe("student");
  });

  it("ApiResponse(data) 래퍼 로그인 응답에서도 토큰/유저 정보를 매핑한다", () => {
    const wrapped = {
      success: true,
      data: {
        accessToken: "wrapped-access",
        refreshToken: "wrapped-refresh",
        user: {
          id: "2",
          name: "래핑된유저",
          role: "student",
          studentId: "20204567",
          department: "전자전기공학과",
          college: "전자정보대학",
        },
      },
    };

    const session = mapAuthLoginResponse(wrapped as never);

    expect(session.tokens.accessToken).toBe("wrapped-access");
    expect(session.tokens.refreshToken).toBe("wrapped-refresh");
    expect(session.user?.studentId).toBe("20204567");
  });
});
