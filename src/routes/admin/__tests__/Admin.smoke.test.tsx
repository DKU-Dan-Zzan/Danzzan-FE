// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Admin from "@/routes/admin/Admin";
import type { NoticeStatusFilter } from "@/api/app/admin/adminApi";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const api = vi.hoisted(() => ({
  createNotice: vi.fn(), updateNotice: vi.fn(), archiveNotice: vi.fn(), restoreNotice: vi.fn(),
  createAd: vi.fn(), updateAd: vi.fn(), deleteAd: vi.fn(), uploadAd: vi.fn(),
  reloadNotices: vi.fn(), reloadAds: vi.fn(), saveEmergency: vi.fn(),
}));
const state = vi.hoisted(() => ({ status: "ACTIVE" as NoticeStatusFilter, loading: false }));
vi.mock("@/api/app/admin/adminApi", () => ({
  createAdminNotice: api.createNotice, updateAdminNotice: api.updateNotice,
  deleteAdminNotice: api.archiveNotice, restoreAdminNotice: api.restoreNotice,
  uploadNoticeImageDirect: vi.fn(), updateNoticeDisplayOrder: vi.fn(),
  createAdminAd: api.createAd, updateAdminAdById: api.updateAd,
  deleteAdminAdById: api.deleteAd, uploadAdImageDirect: api.uploadAd,
}));
vi.mock("@/hooks/app/admin/useAdminNotices", () => ({ useAdminNotices: () => ({
  noticeKeyword: "", setNoticeKeyword: vi.fn(), noticePage: 0, noticeTotalPages: 1,
  notices: [{ id: 7, title: "기존 공지", content: "공지 내용", author: "개발팀", createdAt: "2026-10-12", updatedAt: "2026-10-12" }],
  noticeLoading: state.loading, noticeStatus: state.status, setNoticeStatus: vi.fn(), reloadNotices: api.reloadNotices,
}) }));
vi.mock("@/hooks/app/admin/useAdminAds", () => ({ useAdminAds: () => ({
  adLoading: false,
  allAds: [{ id: 8, title: "기존 광고", imageUrl: "https://example.com/ad.jpg", linkUrl: null, placement: "HOME_BOTTOM", isActive: true }],
  reloadAds: api.reloadAds,
}) }));
vi.mock("@/routes/admin/hooks/useEmergencyNotice", () => ({ useEmergencyNotice: () => ({
  emergencyMessage: "긴급 안내", setEmergencyMessage: vi.fn(), emergencyActive: true,
  setEmergencyActive: vi.fn(), emergencyLoading: false, handleSaveEmergency: api.saveEmergency,
}) }));
vi.mock("sonner", () => ({ Toaster: () => null, toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks();
  state.status = "ACTIVE"; state.loading = false;
  api.uploadAd.mockResolvedValue({ imageUrl: "https://example.com/new.jpg" });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); });
async function render(path = "/admin/notices") {
  await act(async () => root.render(<MemoryRouter initialEntries={[path]}><Admin /></MemoryRouter>));
}
async function click(label: string, scope: ParentNode = document) {
  const button = [...scope.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.trim() === label || button.getAttribute("aria-label") === label);
  expect(button, label).toBeDefined();
  await act(async () => button!.click());
}
async function input(selector: string, value: string) {
  const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
  expect(element).not.toBeNull();
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("Unified notice and advertisement page", () => {
  it("shows emergency, regular notices and advertisements in order", async () => {
    await render();
    expect(container.querySelector("h1")?.textContent).toBe("공지·광고");
    expect([...container.querySelectorAll("main > section h2")].map(heading => heading.textContent))
      .toEqual(["긴급 공지", "일반 공지 목록", "광고 배너 관리"]);
    await click("긴급 공지 저장");
    expect(api.saveEmergency).toHaveBeenCalledOnce();
  });
  it("scrolls an advertisement deep link after initial loading without jumping again on refresh", async () => {
    const scroll = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scroll });
    try {
      state.loading = true;
      await render("/admin/notices#ad-banners");
      await act(async () => { await new Promise(resolve => requestAnimationFrame(resolve)); });
      expect(scroll).not.toHaveBeenCalled();
      state.loading = false;
      await render("/admin/notices#ad-banners");
      await act(async () => { await new Promise(resolve => requestAnimationFrame(resolve)); });
      expect(scroll).toHaveBeenCalledWith({ block: "start" });
      expect(scroll.mock.contexts[0]).toBe(container.querySelector("#ad-banners"));
      state.loading = true;
      await render("/admin/notices#ad-banners");
      state.loading = false;
      await render("/admin/notices#ad-banners");
      await act(async () => { await new Promise(resolve => requestAnimationFrame(resolve)); });
      expect(scroll).toHaveBeenCalledOnce();
    } finally { Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView"); }
  });
  it("creates and edits notices using the existing modal and API handlers", async () => {
    await render();
    await click("새 공지");
    await input('input[placeholder="공지사항 제목을 입력해주세요"]', "새 제목");
    await input('textarea[placeholder="공지사항 본문을 입력해주세요"]', "새 내용");
    await click("등록하기");
    expect(api.createNotice).toHaveBeenCalledWith(expect.objectContaining({ title: "새 제목", content: "새 내용" }));
    await click("기존 공지 공지 수정");
    await input('input[placeholder="공지사항 제목을 입력해주세요"]', "수정 제목");
    await click("수정하기");
    expect(api.updateNotice).toHaveBeenCalledWith(7, expect.objectContaining({ title: "수정 제목" }));
    expect(api.reloadNotices).toHaveBeenCalledTimes(2);
  });
  it.each(["ACTIVE", "DELETED"] as const)("preserves notice archive/restore confirmation for %s", async status => {
    state.status = status;
    await render();
    await click(status === "ACTIVE" ? "기존 공지 공지 보관함 이동" : "기존 공지 공지 복원");
    const operation = status === "ACTIVE" ? api.archiveNotice : api.restoreNotice;
    expect(operation).not.toHaveBeenCalled();
    await click(status === "ACTIVE" ? "보관함 이동" : "복원", document.querySelector('[role="alertdialog"]')!);
    expect(operation).toHaveBeenCalledWith(7);
    expect(api.reloadNotices).toHaveBeenCalled();
  });
  it("uploads and creates an advertisement, then edits it through the same page", async () => {
    await render();
    await click("이미지 추가");
    await input('input[placeholder="예: 단국대 축제 후원사 배너"]', "새 광고");
    const file = new File(["image"], "ad.png", { type: "image/png" });
    const fileInput = document.querySelector<HTMLInputElement>('[role="dialog"] input[type="file"]')!;
    await act(async () => {
      Object.defineProperty(fileInput, "files", { value: [file], configurable: true });
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(api.uploadAd).toHaveBeenCalledWith(file);
    await click("등록하기");
    expect(api.createAd).toHaveBeenCalledWith(expect.objectContaining({ title: "새 광고", imageUrl: "https://example.com/new.jpg" }));
    await click("광고 정보 수정");
    await input('input[placeholder="예: 단국대 축제 후원사 배너"]', "수정 광고");
    await click("수정하기");
    expect(api.updateAd).toHaveBeenCalledWith(8, expect.objectContaining({ title: "수정 광고" }));
    expect(api.reloadAds).toHaveBeenCalledTimes(2);
  });
  it("deletes advertisements only after confirmation", async () => {
    await render();
    await click("광고 이미지 삭제");
    expect(api.deleteAd).not.toHaveBeenCalled();
    await click("삭제", document.querySelector('[role="alertdialog"]')!);
    expect(api.deleteAd).toHaveBeenCalledWith(8);
    expect(api.reloadAds).toHaveBeenCalledOnce();
  });
});
