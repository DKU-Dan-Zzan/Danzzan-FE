// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import MyPage from "@/routes/mypage/MyPage";
import { authStore } from "@/store/common/authStore";
import { setTicketingEnabled } from "@/lib/app/festival/festivalCalendar";
import { FestivalBrandingContext } from "@/lib/app/festival/festivalBrandingContext";

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
async function render(posterImageUrl: string | null = null) {
  await act(async () => root.render(<QueryClientProvider client={client}><MemoryRouter><FestivalBrandingContext.Provider value={{ festivalSettingId: 1, logoImageUrl: null, posterImageUrl }}><MyPage /></FestivalBrandingContext.Provider></MemoryRouter></QueryClientProvider>));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
}
it("공식 포스터를 기존 상단 hero에 사용하고, 실패하면 정적 포스터와 기존 fade로 복귀한다", async () => {
  await render("http://localhost:8080/uploads/festival/1/poster/new.jpg");
  const hero = container.querySelector<HTMLImageElement>('img[aria-hidden="true"]')!;
  expect(hero.getAttribute("src")).toBe("http://localhost:8080/uploads/festival/1/poster/new.jpg");
  expect(hero.className).toContain("object-cover object-top");
  expect(hero.style.transform).toBe("none");
  expect(hero.parentElement?.parentElement?.getAttribute("class")).toBe("relative");
  expect(hero.nextElementSibling?.getAttribute("style")).toContain("var(--poster-bg) 100%");
  expect(hero.nextElementSibling?.getAttribute("style")).toContain("58%");
  expect(container.textContent).toContain("테스트 학생");
  expect(container.textContent).toContain("내 정보");
  await act(async () => hero.dispatchEvent(new Event("error")));
  expect(container.querySelector<HTMLImageElement>('img[aria-hidden="true"]')?.getAttribute("src")).toBe("/posters/legend-poster-vertical.jpeg");
  expect(container.querySelector<HTMLImageElement>('img[aria-hidden="true"]')?.className).toContain("object-[50%_44%]");
  expect(container.querySelector<HTMLImageElement>('img[aria-hidden="true"]')?.nextElementSibling?.getAttribute("style")).toContain("22%");
});
it("비로그인 안내 화면도 공식 포스터와 정적 fallback을 사용한다", async () => {
  authStore.clear();
  await render("https://cdn.example.com/poster.jpg");
  const poster = container.querySelector<HTMLImageElement>('img[aria-hidden="true"]')!;
  expect(poster.getAttribute("src")).toBe("https://cdn.example.com/poster.jpg");
  expect(poster.className).toContain("object-cover object-top");
  expect(poster.style.transform).toBe("none");
  await act(async () => poster.dispatchEvent(new Event("error")));
  expect(container.querySelector<HTMLImageElement>('img[aria-hidden="true"]')?.getAttribute("src")).toBe("/posters/legend-poster-vertical.jpeg");
  expect(container.querySelector<HTMLImageElement>('img[aria-hidden="true"]')?.className).toContain("object-[50%_38%]");
});
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
