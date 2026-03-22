// 역할: 티켓팅 도메인 동작을 검증하는 테스트 모듈입니다.
import { shouldShowTicketingHeader } from "@/lib/ticketing/navigation/headerVisibility";

const createJwtLikeToken = (payload: Record<string, unknown>): string => {
  const encode = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
};

describe("headerVisibility", () => {
  it("티켓팅 로그인 페이지에서는 헤더를 노출한다", () => {
    expect(
      shouldShowTicketingHeader({
        pathname: "/ticket/login",
        accessToken: null,
        role: null,
      }),
    ).toBe(true);
  });

  it("티켓팅 회원가입 페이지에서도 헤더를 노출한다", () => {
    expect(
      shouldShowTicketingHeader({
        pathname: "/ticket/signup",
        accessToken: null,
        role: null,
      }),
    ).toBe(true);
  });

  it("티켓팅 비밀번호 재설정 페이지에서도 헤더를 노출한다", () => {
    expect(
      shouldShowTicketingHeader({
        pathname: "/ticket/reset-password",
        accessToken: null,
        role: null,
      }),
    ).toBe(true);
  });

  it("role 상태값이 어긋나도 토큰이 학생 권한이면 헤더를 노출한다", () => {
    const token = createJwtLikeToken({ role: "ROLE_USER" });

    expect(
      shouldShowTicketingHeader({
        pathname: "/ticket/my-ticket",
        accessToken: token,
        role: "admin",
      }),
    ).toBe(true);
  });

  it("액세스 토큰이 없으면 헤더를 숨긴다", () => {
    expect(
      shouldShowTicketingHeader({
        pathname: "/ticket/my-ticket",
        accessToken: null,
        role: "student",
      }),
    ).toBe(false);
  });
});
