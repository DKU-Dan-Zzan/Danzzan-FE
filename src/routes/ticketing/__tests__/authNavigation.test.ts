import { describe, expect, it } from "vitest";
import {
  getMyTicketNavigationTarget,
  MY_TICKET_PATH,
  resolveTicketingLoginRedirect,
  TICKETING_DEFAULT_PATH,
} from "@/routes/ticketing/authNavigation";

describe("authNavigation", () => {
  it("비로그인 내 티켓 클릭 시 로그인 redirect 경로를 반환한다", () => {
    expect(getMyTicketNavigationTarget(false)).toBe(
      `/ticket/login?redirect=${encodeURIComponent(MY_TICKET_PATH)}`,
    );
  });

  it("로그인 학생 내 티켓 클릭 시 myticket 경로를 반환한다", () => {
    expect(getMyTicketNavigationTarget(true)).toBe(MY_TICKET_PATH);
  });

  it("허용된 ticket 내부 redirect를 유지한다", () => {
    expect(resolveTicketingLoginRedirect("/ticket/myticket")).toBe("/ticket/myticket");
    expect(resolveTicketingLoginRedirect("/ticket/ticketing?eventId=7")).toBe("/ticket/ticketing?eventId=7");
  });

  it("외부/비정상 redirect는 기본 경로로 대체한다", () => {
    expect(resolveTicketingLoginRedirect(null)).toBe(TICKETING_DEFAULT_PATH);
    expect(resolveTicketingLoginRedirect("https://evil.example.com")).toBe(TICKETING_DEFAULT_PATH);
    expect(resolveTicketingLoginRedirect("https://evil.example.com/ticket/myticket")).toBe(TICKETING_DEFAULT_PATH);
    expect(resolveTicketingLoginRedirect("//evil.example.com/ticket/myticket")).toBe(TICKETING_DEFAULT_PATH);
    expect(resolveTicketingLoginRedirect("/mypage")).toBe(TICKETING_DEFAULT_PATH);
  });

  it("혼동 가능한 ticket prefix redirect는 기본 경로로 대체한다", () => {
    expect(resolveTicketingLoginRedirect("/ticketing")).toBe(TICKETING_DEFAULT_PATH);
    expect(resolveTicketingLoginRedirect("/ticket-admin")).toBe(TICKETING_DEFAULT_PATH);
  });

  it("ticket 경로 내부 dot-segment 우회는 기본 경로로 대체한다", () => {
    expect(resolveTicketingLoginRedirect("/ticket/../mypage")).toBe(TICKETING_DEFAULT_PATH);
    expect(resolveTicketingLoginRedirect("/ticket/%2e%2e/mypage")).toBe(TICKETING_DEFAULT_PATH);
  });
});
