import { shouldShowTicketingHeader } from "@/lib/ticketing/navigation/headerVisibility";

const createJwtLikeToken = (payload: Record<string, unknown>): string => {
  const encode = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
};

describe("headerVisibility", () => {
  it("티켓팅 인증 페이지에서는 헤더를 숨긴다", () => {
    const token = createJwtLikeToken({ role: "ROLE_USER" });

    expect(
      shouldShowTicketingHeader({
        pathname: "/ticket/login",
        accessToken: token,
        role: "student",
      }),
    ).toBe(false);
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
