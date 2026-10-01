// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TicketingApp from "@/routes/ticketing/TicketingApp";
import { authStore } from "@/store/common/authStore";
import { setTicketingEnabled } from "@/lib/app/festival/festivalCalendar";

// Page data is outside this route-policy test; use the real router, auth guard and OFF gate.
vi.mock("@/routes/ticketing/my-ticket/MyTicket", () => ({ default: () => <p>보유 티켓 목록</p> }));
vi.mock("@/routes/ticketing/ticketing/Ticketing", () => ({ default: () => <p>예매 화면</p> }));
vi.mock("@/routes/ticketing/login/Login", () => ({ default: () => <p>로그인 양식</p> }));
vi.mock("@/routes/ticketing/signup/Signup", () => ({ default: () => <p>회원가입 양식</p> }));
vi.mock("@/routes/ticketing/reset-password/ResetPassword", () => ({ default: () => <p>비밀번호 변경 양식</p> }));
vi.mock("@/components/ticketing/layout/UserLayout", async () => {
  const { Outlet } = await import("react-router-dom");
  return { UserLayout: Outlet };
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  authStore.setSession({
    tokens: { accessToken: `header.${btoa(JSON.stringify({ sub: "test", role: "ROLE_USER", exp: 9999999999 }))}.signature`, refreshToken: "refresh", expiresIn: null },
    user: null,
  });
  setTicketingEnabled(false);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  authStore.clear();
  setTicketingEnabled(false);
});
async function render(path: string) {
  await act(async () => root.render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route path="/ticket/*" element={<TicketingApp />} /></Routes>
    </MemoryRouter>,
  ));
}

describe("티켓팅 OFF 경로 정책", () => {
  it.each(["/ticket/my-ticket", "/ticket/myticket?eventId=15", "/ticket/ticketing"])("OFF이면 직접 접근한 %s도 안내 화면을 보여준다", async (path) => {
    await render(path);
    expect(container.querySelector("#service-closed-title")).not.toBeNull();
    expect(container.textContent).not.toContain("보유 티켓 목록");
    expect(container.textContent).not.toContain("예매 화면");
  });
  it.each([["login", "로그인 양식"], ["signup", "회원가입 양식"], ["reset-password", "비밀번호 변경 양식"]])("OFF여도 %s는 유지한다", async (path, text) => {
    await render(`/ticket/${path}`);
    expect(container.textContent).toContain(text);
    expect(container.querySelector("#service-closed-title")).toBeNull();
  });
  it("열려 있는 내 티켓도 OFF로 바뀌면 닫히고 ON이면 다시 열린다", async () => {
    setTicketingEnabled(true);
    await render("/ticket/my-ticket");
    expect(container.textContent).toContain("보유 티켓 목록");
    await act(async () => setTicketingEnabled(false));
    expect(container.querySelector("#service-closed-title")).not.toBeNull();
    expect(container.textContent).not.toContain("보유 티켓 목록");
    await act(async () => setTicketingEnabled(true));
    expect(container.textContent).toContain("보유 티켓 목록");
  });
});
