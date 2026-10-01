// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import MyPage from "@/routes/mypage/MyPage";
import { authStore } from "@/store/common/authStore";
import { setTicketingEnabled } from "@/lib/app/festival/festivalCalendar";

const getMyTickets = vi.hoisted(() => vi.fn());
vi.mock("@/api/ticketing/ticketApi", () => ({ ticketApi: { getMyTickets } }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
let client: QueryClient;
beforeEach(() => {
  authStore.setSession({
    tokens: { accessToken: `header.${btoa(JSON.stringify({ sub: "test", role: "ROLE_USER", exp: 9999999999 }))}.signature`, refreshToken: "refresh", expiresIn: null },
    user: { id: "1", name: "테스트 학생", role: "student", department: "테스트학과", studentId: "90000001", college: "테스트대학" },
  });
  getMyTickets.mockReset().mockResolvedValue([{ id: "ticket-1", status: "issued", eventName: "축제 DAY 1", eventDate: "2026-09-01", issuedAt: "2026-08-31", seat: "1", qrCodeUrl: "" }]);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  container.remove();
  authStore.clear();
  setTicketingEnabled(false);
});
async function render() {
  await act(async () => root.render(<QueryClientProvider client={client}><MemoryRouter><MyPage /></MemoryRouter></QueryClientProvider>));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
}
it("OFF여도 내정보와 계정 관리는 열리지만 티켓 조회 요청과 메뉴는 없다", async () => {
  setTicketingEnabled(false);
  await render();
  expect(container.textContent).toContain("테스트 학생");
  expect(container.textContent).toContain("90000001");
  expect(container.textContent).toContain("계정 관리");
  expect(container.textContent).not.toContain("내 예매 티켓");
  expect(getMyTickets).not.toHaveBeenCalled();
});
it("ON에서 조회한 티켓 수량도 OFF로 바뀌면 숨긴다", async () => {
  setTicketingEnabled(true);
  await render();
  expect(container.textContent).toContain("내 예매 티켓");
  expect(container.textContent).toContain("1장");
  await act(async () => setTicketingEnabled(false));
  expect(container.textContent).not.toContain("내 예매 티켓");
  expect(container.textContent).toContain("테스트 학생");
});
