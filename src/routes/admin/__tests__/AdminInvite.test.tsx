// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import AdminInvite from "@/routes/admin/AdminInvite";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const state = vi.hoisted(() => ({ role: "admin", epoch: 1, user: { id: "1" } as { id: string } | null }));
const api = vi.hoisted(() => ({ list: vi.fn(), candidate: vi.fn(), updateRole: vi.fn(), promoteAdmin: vi.fn(), demoteAdmin: vi.fn() }));
vi.mock("@/api/app/admin/adminInviteApi", () => ({ adminInviteApi: api }));
vi.mock("@/store/common/authStore", () => ({ authStore: { getSnapshot: () => state, getSessionEpoch: () => state.epoch, subscribe: () => () => {} } }));
vi.mock("sonner", () => ({ Toaster: () => null, toast: { success: vi.fn(() => "staff-success"), dismiss: vi.fn() } }));
const member = { id: 2, studentId: "00123", name: "홍길동", college: "공과대학", major: "컴퓨터공학", role: "USER", permissions: [] };
let root: Root; let container: HTMLDivElement;
async function render() {
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  await act(async () => { root.render(<MemoryRouter><QueryClientProvider client={client}><AdminInvite /></QueryClientProvider></MemoryRouter>); });
  await settle();
}
async function settle() { await act(async () => { await new Promise(r => setTimeout(r, 20)); }); }
async function clickButton(label: string) {
  const button = [...container.querySelectorAll("button")].find(button => button.textContent === label)!;
  await act(async () => button.click());
  await settle();
}
async function selectMenu(memberName: string, itemLabel: string) {
  const trigger = container.querySelector<HTMLButtonElement>(`[aria-label="${memberName} 권한 관리 메뉴"]`)!;
  await act(async () => trigger.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 })));
  await settle();
  const item = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(element => element.textContent === itemLabel)!;
  await act(async () => item.click());
  await settle();
}
async function search() {
  await act(async () => {
    const input = container.querySelector("input")!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "00123");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => { container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  await settle();
}
beforeEach(() => { vi.clearAllMocks(); state.role = "admin"; state.epoch = 1; state.user = { id: "1" }; api.list.mockResolvedValue({ items: [], page: 0, size: 20, totalPages: 0, totalElements: 0, managementEnabled: true }); api.candidate.mockResolvedValue(member); });
afterEach(async () => { if (root) await act(async () => root.unmount()); container?.remove(); });
describe("AdminInvite", () => {
  it("shows admins alongside managers, keeping the current admin immutable", async () => {
    api.list.mockResolvedValue({
      items: [
        { ...member, id: 1, studentId: "00122", name: "최고관리자", role: "ADMIN" },
        { ...member, role: "MANAGER", permissions: ["OPERATIONS"] },
      ],
      page: 0, size: 20, totalPages: 1, totalElements: 2, managementEnabled: true,
    });
    await render();
    const rows = container.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain("최고 관리자");
    expect(rows[0].textContent).toContain("본인 계정");
    expect(rows[0].querySelector("button")).toBeNull();
    expect(rows[1].querySelector('[aria-label="홍길동 권한 관리 메뉴"]')).not.toBeNull();
    expect(container.querySelector("#staff-list-title")?.textContent).toContain("2명");
  });
  it("filters server pages by responsibility, resets pagination, and preserves filter on refresh", async () => {
    api.list.mockImplementation(async (page: number, _size: number, _signal: AbortSignal, filter: string) => ({
      items: [{ ...member, name: filter === "ADMIN" ? "최고관리자 결과" : "매니저 결과", role: filter === "ADMIN" ? "ADMIN" : "MANAGER", permissions: ["TICKETING"] }],
      page, size: 20, totalPages: filter === "ALL" ? 2 : 1, totalElements: filter === "ALL" ? 21 : 1, managementEnabled: true,
    }));
    await render();
    await clickButton("다음");
    expect(api.list).toHaveBeenLastCalledWith(1, 20, expect.any(AbortSignal), "ALL");
    await clickButton("티켓 매니저");
    expect(api.list).toHaveBeenLastCalledWith(0, 20, expect.any(AbortSignal), "TICKETING");
    expect(container.querySelector('[aria-pressed="true"]')?.textContent).toBe("티켓 매니저");
    expect(container.querySelector('#staff-list-title')?.textContent).toContain("1명");
    expect(container.textContent).toContain("1 / 1");
    await clickButton("새로고침");
    expect(api.list).toHaveBeenLastCalledWith(0, 20, expect.any(AbortSignal), "TICKETING");
    for (const [label, filter] of [["운영 매니저", "OPERATIONS"], ["티켓&운영 매니저", "BOTH"], ["최고 관리자", "ADMIN"], ["전체", "ALL"]]) {
      await clickButton(label);
      expect(api.list).toHaveBeenLastCalledWith(0, 20, expect.any(AbortSignal), filter);
      expect(container.querySelector('[aria-pressed="true"]')?.textContent).toBe(label);
      if (filter === "ADMIN") expect(container.querySelector("tbody tr")?.textContent).toContain("최고관리자 결과");
    }
  });
  it("explains an empty filtered result without showing an invalid page", async () => {
    await render();
    await clickButton("운영 매니저");
    expect(container.textContent).toContain("선택한 권한에 해당하는 관리자가 없습니다.");
    expect(container.textContent).not.toContain("등록된 관리자가 없습니다.");
    expect(container.querySelector('[aria-label="매니저 목록 페이지"]')).toBeNull();
  });
  it("shows invitation and the manager list together with section anchors", async () => {
    await render();
    expect(container.querySelector("h1")?.textContent).toBe("운영진 관리");
    expect(container.querySelector("#invite-manager #staff-search-title")).not.toBeNull();
    expect(container.querySelector("#manager-list #staff-list-title")).not.toBeNull();
  });
  it("does not request private data for manager", async () => { state.role = "manager"; await render(); expect(api.list).not.toHaveBeenCalled(); });
  it("shows an empty list without page 1/0 and explains manager scope", async () => { await render(); expect(container.textContent).toContain("등록된 관리자가 없습니다"); expect(container.textContent).not.toContain("1 / 0"); expect(container.textContent).toContain("세부 권한을 관리"); });
  it("shows list errors separately from empty data", async () => { api.list.mockRejectedValue(new Error("offline")); await render(); expect(container.textContent).toContain("불러오지 못했습니다"); expect(container.textContent).not.toContain("등록된 관리자가 없습니다"); });
  it("keeps grant disabled when server gate is false", async () => { api.list.mockResolvedValue({ items: [], page: 0, size: 20, totalPages: 0, totalElements: 0, managementEnabled: false }); await render(); await search(); const grant = [...container.querySelectorAll("button")].find(b => b.textContent?.includes("매니저로 지정")); expect(grant).toBeDefined(); expect(grant?.disabled).toBe(true); });
  it("requires a target-specific dialog before mutation", async () => { await render(); await search(); const checkbox = container.querySelector<HTMLInputElement>('input[type="checkbox"]')!; await act(async () => checkbox.click()); const grant = [...container.querySelectorAll("button")].find(b => b.textContent?.includes("매니저로 지정"))!; await act(async () => grant.click()); expect(api.updateRole).not.toHaveBeenCalled(); expect(document.querySelector('[role="alertdialog"]')?.textContent).toContain("00123"); });
  it("confirms promotion before using the dedicated API and returns focus to the menu trigger", async () => {
    api.list.mockResolvedValue({
      items: [{ ...member, role: "MANAGER", permissions: ["OPERATIONS"] }], page: 0, size: 20, totalPages: 1, totalElements: 1, managementEnabled: true,
    });
    api.promoteAdmin.mockResolvedValue({ ...member, role: "ADMIN", permissions: ["OPERATIONS", "TICKETING"] });
    await render();
    await selectMenu("홍길동", "최고 관리자로 지정");
    expect(api.promoteAdmin).not.toHaveBeenCalled();
    const dialog = document.querySelector('[role="alertdialog"]')!;
    expect(dialog.textContent).toContain("홍길동 · 00123");
    expect(dialog.textContent).toContain("다른 회원의 권한을 관리");
    await act(async () => [...dialog.querySelectorAll("button")].find(button => button.textContent === "최고 관리자로 지정")!.click());
    await settle();
    expect(api.promoteAdmin).toHaveBeenCalledWith(2);
    expect(toast.success).toHaveBeenCalledWith("홍길동님을 최고 관리자로 지정했습니다.", expect.objectContaining({ duration: 5000 }));
    expect(container.textContent).not.toContain("홍길동님을 최고 관리자로 지정했습니다.");
  });
  it("does not mutate when promotion confirmation is cancelled", async () => {
    api.list.mockResolvedValue({ items: [{ ...member, role: "MANAGER", permissions: ["TICKETING"] }], page: 0, size: 20, totalPages: 1, totalElements: 1, managementEnabled: true });
    await render();
    const trigger = container.querySelector<HTMLButtonElement>('[aria-label="홍길동 권한 관리 메뉴"]')!;
    await act(async () => trigger.focus());
    await selectMenu("홍길동", "최고 관리자로 지정");
    await act(async () => [...document.querySelectorAll("button")].find(button => button.textContent === "취소")!.click());
    await settle();
    expect(api.promoteAdmin).not.toHaveBeenCalled();
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
  it("demotes another admin to a manager only after confirmation while leaving self immutable", async () => {
    api.list.mockResolvedValue({
      items: [
        { ...member, id: 1, name: "본인", role: "ADMIN", permissions: [] },
        { ...member, id: 3, name: "다른관리자", role: "ADMIN", permissions: [] },
      ], page: 0, size: 20, totalPages: 1, totalElements: 2, managementEnabled: true,
    });
    api.demoteAdmin.mockResolvedValue({ ...member, id: 3, name: "다른관리자", role: "MANAGER", permissions: ["OPERATIONS", "TICKETING"] });
    await render();
    expect(container.textContent).toContain("본인 계정");
    expect(container.querySelector('[aria-label="본인 권한 관리 메뉴"]')).toBeNull();
    await selectMenu("다른관리자", "최고 관리자 권한 회수");
    expect(api.demoteAdmin).not.toHaveBeenCalled();
    const dialog = document.querySelector('[role="alertdialog"]')!;
    expect(dialog.textContent).toContain("티켓·운영 매니저로 변경");
    expect(dialog.textContent).toContain("두 운영 권한은 유지");
    await act(async () => [...dialog.querySelectorAll("button")].find(button => button.textContent === "매니저로 변경")!.click());
    await settle();
    expect(api.demoteAdmin).toHaveBeenCalledWith(3);
    expect(toast.success).toHaveBeenCalledWith("다른관리자님을 티켓·운영 매니저로 변경했습니다.", expect.objectContaining({ duration: 5000 }));
  });
  it.each([null, "", "  "])("does not expose any admin demotion controls until the current admin can be identified (%s)", async userId => {
    state.user = userId === null ? null : { id: userId };
    api.list.mockResolvedValue({
      items: [
        { ...member, id: 1, name: "현재일수도있는관리자", role: "ADMIN", permissions: [] },
        { ...member, id: 3, name: "다른관리자일수도있는계정", role: "ADMIN", permissions: [] },
      ], page: 0, size: 20, totalPages: 1, totalElements: 2, managementEnabled: true,
    });
    await render();
    expect(container.textContent).toContain("로그인 정보 확인 불가");
    expect(container.textContent).toContain("현재 로그인 정보를 확인할 수 없어 최고 관리자 권한 회수를 제한했습니다.");
    expect(container.textContent).toContain("다시 로그인하면 최고 관리자 권한을 관리할 수 있습니다.");
    expect(container.querySelector('[aria-label="현재일수도있는관리자 권한 관리 메뉴"]')).toBeNull();
    expect(container.querySelector('[aria-label="다른관리자일수도있는계정 권한 관리 메뉴"]')).toBeNull();
  });
});
