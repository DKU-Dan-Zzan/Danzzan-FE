// @vitest-environment jsdom
import { setTicketingEnabled, getTicketCardBackgroundImageUrl, getTicketingBackgroundImageUrl, setTicketingBackgroundImageUrl, setTicketCardBackgroundImageUrl } from "@/lib/app/festival/festivalCalendar";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recommendPosterBackground } from "@/api/app/festival/posterBackgroundApi";
import { uploadTicketingBackground } from "@/api/app/festival/festivalSettingsApi";
import AdminTheme from "@/routes/admin/AdminTheme";
import type { ActiveThemeResponse, ThemeData } from "@/api/app/festival/activeThemeApi";
import { adminHomeImageApi } from "@/api/app/admin/adminHomeImageApi";
import { adminThemeApi } from "@/api/app/admin/adminThemeApi";
import type { ThemeRecommendationResponse } from "@/api/app/admin/adminThemeApi";
import { festivalBrandingApi } from "@/api/app/festival/festivalBrandingApi";
import { THEME_FIELDS, validateThemeDraft } from "@/routes/admin/themeEditor";
import { createMayTheme, getDefaultThemeData, getMayThemeData } from "@/lib/app/festival/defaultTheme";
import { THEME_CORE_VARIABLES } from "@/lib/app/festival/activeTheme";
import { createAdminThemeActionStyle } from "@/routes/admin/adminThemeActionColors";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const permissions = vi.hoisted(() => ({ role: "admin", permissions: ["OPERATIONS", "TICKETING"] }));
vi.mock("@/store/common/authStore", () => ({ authStore: { subscribe: () => () => {}, getSnapshot: () => permissions } }));
vi.mock("@/api/app/festival/posterBackgroundApi", async original => ({ ...await original<typeof import("@/api/app/festival/posterBackgroundApi")>(), recommendPosterBackground: vi.fn() }));
vi.mock("@/api/app/festival/festivalSettingsApi", () => ({ uploadTicketingBackground: vi.fn() }));
const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ Toaster: () => null, toast: toastMock }));
vi.mock("@/api/app/admin/adminThemeApi", () => ({ adminThemeApi: {
  list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), activate: vi.fn(), activateDefault: vi.fn(), recommend: vi.fn(), applyBundle: vi.fn(),
} }));
vi.mock("@/api/app/festival/festivalBrandingApi", () => ({ festivalBrandingApi: {
  get: vi.fn().mockResolvedValue({ festivalSettingId: 1, posterImageUrl: null, logoImageUrl: null }),
  upload: vi.fn(),
  extractPosterColors: vi.fn(),
} }));
vi.mock("@/api/app/admin/adminHomeImageApi", () => ({ adminHomeImageApi: { list: vi.fn(), preview: vi.fn(), stageUpload: vi.fn(), replaceFirst: vi.fn() } }));
vi.mock("@/routes/admin/HomeWideImagesPanel", () => ({ HomeWideImagesPanel: () => null }));

const colors: ThemeData = {
  brand: { primary: "#ff642d", secondary: "#f5e3a3", accent: "#ff642d", strong: "#e13600" },
  status: { success: "#2e7d32", warning: "#b26a00", danger: "#b3261e", pending: "#e3776a" },
  category: { pub: "#ff642d", foodTruck: "#ec4899", experience: "#10b981", event: "#f6ca3b", restArea: "#8b5cf6", facility: "#3b82f6" },
};
const active: ActiveThemeResponse = { id: 1, festivalSettingId: 1, name: "활성 축제", themeData: colors, createdAt: "", updatedAt: "", active: true };
const inactive: ActiveThemeResponse = { ...active, id: 2, name: "저장된 테마", active: false };
const recommendation: ThemeRecommendationResponse = { candidates: [
  { id: "balanced", name: "Balanced", description: "균형형", themeData: { ...colors, brand: { ...colors.brand, primary: "#4EB15E" } } },
  { id: "vibrant", name: "Vibrant", description: "생동감형", themeData: { ...colors, brand: { ...colors.brand, primary: "#F69324" } } },
  { id: "deep", name: "Deep", description: "딥톤형", themeData: { ...colors, brand: { ...colors.brand, primary: "#983508" } } },
] };
let host: HTMLDivElement;
let root: Root;

const buttons = (text: string) => Array.from(host.querySelectorAll("button")).filter((button) => button.textContent?.trim() === text);
const setInput = async (label: string, value: string) => {
  const element = host.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

function ThemeNavigationTestControls() {
  const navigate = useNavigate();
  return <><button type="button" onClick={() => navigate("/admin/theme#theme-ai")}>AI 영역 링크</button>
    <button type="button" onClick={() => navigate("/admin/theme#theme-management")}>관리 영역 링크</button></>;
}

async function render(withNavigation = false, mode: "manage" | "select" = "manage") {
  await act(async () => { root.render(<MemoryRouter initialEntries={[mode === "select" ? "/admin/theme/select" : "/admin/theme"]}>
    {withNavigation && <ThemeNavigationTestControls />}<AdminTheme mode={mode} />
  </MemoryRouter>); });
}

beforeEach(() => {
  setTicketingEnabled(true);
  vi.mocked(adminHomeImageApi.list).mockResolvedValue([{ id: 7, imageUrl: "/existing-home.jpg", displayOrder: 0 }]);
  vi.mocked(adminHomeImageApi.preview).mockResolvedValue({ mimeType: "image/jpeg", imageBase64: "/9j/2Q==", width: 900, height: 1600, sourcePosterUrl: "https://cdn.example.com/poster.png" });
  vi.mocked(adminHomeImageApi.stageUpload).mockResolvedValue({ url: "https://cdn.example.com/new-home.jpg" });
  vi.clearAllMocks();
  permissions.role = "admin";
  permissions.permissions = ["OPERATIONS", "TICKETING"];
  setTicketCardBackgroundImageUrl(null); setTicketingBackgroundImageUrl(null);
  vi.mocked(recommendPosterBackground).mockImplementation(async (target, _signal, sourcePosterUrl) => ({ target, sourcePosterUrl, mimeType: "image/jpeg", imageBase64: "/9j/2Q==", width: 800, height: 360, focusX: .5, focusY: .5, reason: "여백" }));
  vi.mocked(uploadTicketingBackground).mockImplementation(async file => ({ url: `https://cdn.example.com/${file.name}` }));
  vi.mocked(adminThemeApi.applyBundle).mockImplementation(async payload => ({ ...active, id: 99, name: payload.name, themeData: payload.themeData }));
  vi.mocked(festivalBrandingApi.get).mockResolvedValue({ festivalSettingId: 1, posterImageUrl: null, logoImageUrl: null });
  vi.mocked(festivalBrandingApi.extractPosterColors).mockReset();
  vi.mocked(festivalBrandingApi.upload).mockReset();
  vi.mocked(adminThemeApi.list).mockResolvedValue([active, inactive]);
  vi.mocked(adminThemeApi.get).mockImplementation(async (id) => id === 2 ? inactive : active);
  vi.mocked(adminThemeApi.create).mockImplementation(async (payload) => ({ ...inactive, id: 3, name: payload.name, themeData: payload.themeData }));
  vi.mocked(adminThemeApi.update).mockImplementation(async (id, payload) => ({ ...inactive, id, name: payload.name, themeData: payload.themeData }));
  vi.mocked(adminThemeApi.activate).mockResolvedValue({ ...inactive, active: true });
  vi.mocked(adminThemeApi.delete).mockResolvedValue(undefined);
  vi.mocked(adminThemeApi.activateDefault).mockReset().mockResolvedValue(undefined);
  // Simulate JSON parsed from the real { candidates: [...] } response, not a bare ThemeData.
  vi.mocked(adminThemeApi.recommend).mockResolvedValue(
    JSON.parse(JSON.stringify(recommendation)) as ThemeRecommendationResponse,
  );
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  document.documentElement.style.setProperty("--theme-brand-primary", "#ff642d");
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  host.remove();
  document.documentElement.style.removeProperty("--theme-brand-primary");
  for (const group of Object.values(THEME_CORE_VARIABLES)) {
    for (const variable of Object.values(group)) document.documentElement.style.removeProperty(variable);
  }
  vi.restoreAllMocks();
});

describe("AdminTheme", () => {
  const chooseMay = async () => {
    await act(async () => { host.querySelector<HTMLButtonElement>('[aria-label="Coastal Sunset 선택"]')!.click(); });
  };
  const savedMay: ActiveThemeResponse = { ...createMayTheme(false), id: 42 };

  it("offers the May palette without writing, then persists and activates a real theme ID", async () => {
    vi.mocked(adminThemeApi.activate).mockResolvedValue({ ...savedMay, id: 3, active: true });
    await render();
    await chooseMay();
    expect(adminThemeApi.get).not.toHaveBeenCalled();
    expect(adminThemeApi.create).not.toHaveBeenCalled();
    expect(host.querySelector<HTMLInputElement>('[aria-label="Primary HEX"]')?.value).toBe("#073161");
    expect(host.querySelector<HTMLInputElement>('[aria-label="Primary HEX"]')?.disabled).toBe(true);
    expect(buttons("삭제")).toHaveLength(0);
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
    setTicketCardBackgroundImageUrl("/existing-ticket.jpg");
    await act(async () => { buttons("Coastal Sunset 적용")[0].click(); });
    expect(adminThemeApi.create).toHaveBeenCalledWith({ name: "Coastal Sunset", themeData: getMayThemeData(), sourcePosterUrl: null, selectedBaseColor: null, sourceColors: null });
    expect(adminThemeApi.activate).toHaveBeenCalledWith(3);
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#073161");
    expect(host.querySelector('[aria-label="현재 활성 테마"]')?.textContent).toContain("Coastal Sunset");
    expect(host.querySelectorAll('[aria-label="Coastal Sunset 선택"]')).toHaveLength(1);
    expect(getTicketCardBackgroundImageUrl()).toBe("/existing-ticket.jpg");
  });

  it("recognizes the persisted active May palette after reload and reuses it on apply", async () => {
    vi.mocked(adminThemeApi.list).mockResolvedValue([{ ...active, active: false }, { ...savedMay, active: true }]);
    vi.mocked(adminThemeApi.activate).mockResolvedValue({ ...savedMay, active: true });
    await render();
    expect(host.querySelector('[aria-label="현재 활성 테마"]')?.textContent).toContain("Coastal Sunset");
    expect(host.querySelectorAll('[aria-label="Coastal Sunset 선택"]')).toHaveLength(1);
    expect(buttons("삭제")).toHaveLength(0);
    expect(host.querySelector('[aria-label="테마 적용 상태"]')?.textContent).toContain("적용 중");
    await chooseDefault();
    await act(async () => { buttons("Tangerine Cream 적용")[0].click(); });
    expect(adminThemeApi.activateDefault).toHaveBeenCalledOnce();
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("");
    vi.mocked(adminThemeApi.list).mockResolvedValue([{ ...active, active: false }, savedMay]);
    await chooseMay();
    await act(async () => { buttons("Coastal Sunset 적용")[0].click(); });
    expect(adminThemeApi.create).not.toHaveBeenCalled();
    expect(adminThemeApi.activate).toHaveBeenCalledWith(42);
  });

  it("keeps colors on failed activation and reuses the saved May copy when retried", async () => {
    vi.mocked(adminThemeApi.create).mockResolvedValue(savedMay);
    vi.mocked(adminThemeApi.activate).mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ ...savedMay, active: true });
    await render();
    await chooseMay();
    await act(async () => { buttons("Coastal Sunset 적용")[0].click(); });
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
    expect(host.querySelector('[aria-label="현재 활성 테마"]')?.textContent).toContain("활성 축제");
    vi.mocked(adminThemeApi.list).mockResolvedValue([active, inactive, savedMay]);
    await act(async () => { buttons("Coastal Sunset 적용")[0].click(); });
    expect(adminThemeApi.create).toHaveBeenCalledOnce();
    expect(adminThemeApi.activate).toHaveBeenNthCalledWith(2, 42);
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#073161");
  });

  it("does not activate anything if saving the May preset fails", async () => {
    vi.mocked(adminThemeApi.create).mockRejectedValueOnce(new Error("offline"));
    await render();
    await chooseMay();
    await act(async () => { buttons("Coastal Sunset 적용")[0].click(); });
    expect(adminThemeApi.activate).not.toHaveBeenCalled();
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
  });

  it("preserves edited same-named themes and makes May copies editable", async () => {
    const edited = { ...savedMay, themeData: { ...getMayThemeData(), brand: { ...getMayThemeData().brand, primary: "#123456" } } };
    vi.mocked(adminThemeApi.list).mockResolvedValue([active, edited]);
    await render();
    // One built-in plus the independently edited saved theme.
    expect(host.querySelector('[aria-label="저장된 테마 목록"]')?.textContent?.match(/Coastal Sunset/g)).toHaveLength(2);
    await chooseMay();
    await act(async () => { buttons("복제")[0].click(); });
    expect(host.querySelector<HTMLInputElement>('[aria-label="테마 이름"]')?.value).toBe("Coastal Sunset 복제");
    expect(host.querySelector<HTMLInputElement>('[aria-label="Primary HEX"]')?.disabled).toBe(false);
    await act(async () => { buttons("저장")[0].click(); });
    expect(adminThemeApi.create).toHaveBeenCalledWith(expect.objectContaining({ name: "Coastal Sunset 복제", themeData: getMayThemeData() }));
    expect(adminThemeApi.update).not.toHaveBeenCalled();
  });

  const chooseDefault = async () => {
    await act(async () => { host.querySelector<HTMLButtonElement>('[aria-label="Tangerine Cream 선택"]')!.click(); });
  };

  it("always offers an immutable original palette and only restores it on successful apply", async () => {
    document.documentElement.style.setProperty("--theme-brand-primary", "#123456");
    document.documentElement.style.setProperty("--theme-brand-strong", "#7546b7");
    setTicketCardBackgroundImageUrl("/existing-ticket.jpg");
    setTicketingBackgroundImageUrl("/existing-background.jpg");
    await render();
    await chooseDefault();
    expect(adminThemeApi.get).not.toHaveBeenCalled();
    expect(adminThemeApi.activateDefault).not.toHaveBeenCalled();
    expect(host.querySelector<HTMLInputElement>('[aria-label="Primary HEX"]')?.value).toBe("#ff642d");
    expect(host.querySelector<HTMLInputElement>('[aria-label="Primary HEX"]')?.disabled).toBe(true);
    expect(host.querySelector<HTMLInputElement>('[aria-label="테마 이름"]')?.disabled).toBe(true);
    expect(buttons("저장")).toHaveLength(0);
    expect(buttons("삭제")).toHaveLength(0);
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#123456");
    await act(async () => { buttons("Tangerine Cream 적용")[0].click(); });
    expect(adminThemeApi.activateDefault).toHaveBeenCalledOnce();
    expect(adminThemeApi.activate).not.toHaveBeenCalled();
    expect(adminThemeApi.create).not.toHaveBeenCalled();
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("");
    expect(host.querySelector('[aria-label="현재 활성 테마"]')?.textContent).toContain("Tangerine Cream");
    expect(getTicketCardBackgroundImageUrl()).toBe("/existing-ticket.jpg");
    expect(getTicketingBackgroundImageUrl()).toBe("/existing-background.jpg");
    expect(host.querySelector<HTMLElement>('[data-testid="admin-theme-action-scope"]')?.style.getPropertyValue("--admin-theme-action-bg"))
      .toBe((createAdminThemeActionStyle(getDefaultThemeData().brand.strong) as Record<string, string>)["--admin-theme-action-bg"]);
    await act(async () => { buttons("저장된 테마")[0].click(); });
    await act(async () => { buttons("저장된 테마 적용")[0].click(); });
    expect(adminThemeApi.activate).toHaveBeenCalledWith(2);
  });

  it("shows only saved and built-in themes on the selection screen and applies each selection", async () => {
    vi.mocked(adminThemeApi.activate).mockResolvedValue({ ...inactive, active: true });
    await render(false, "select");
    expect(host.textContent).toContain("사용할 테마를 선택하세요");
    expect(host.querySelector('[aria-label="AI 테마 추천 영역"]')).toBeNull();
    expect(host.querySelector('[aria-label="테마 편집"]')).toBeNull();
    expect(host.querySelector('[aria-label="새 테마 생성"]')).toBeNull();
    expect(host.querySelector('[data-testid="theme-preview"]')).not.toBeNull();
    expect(host.textContent).toContain("Tangerine Cream");
    expect(host.textContent).toContain("Coastal Sunset");
    expect(host.textContent).toContain("저장된 테마");
    expect(festivalBrandingApi.get).not.toHaveBeenCalled();
    expect(adminHomeImageApi.list).not.toHaveBeenCalled();
    expect(adminHomeImageApi.preview).not.toHaveBeenCalled();
    expect(adminHomeImageApi.stageUpload).not.toHaveBeenCalled();
    expect(adminHomeImageApi.replaceFirst).not.toHaveBeenCalled();
    expect(adminThemeApi.recommend).not.toHaveBeenCalled();

    await act(async () => [...host.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')].find(button => button.textContent?.includes("저장된 테마"))!.click());
    await act(async () => buttons("저장된 테마 적용")[0].click());
    expect(adminThemeApi.activate).toHaveBeenCalledWith(2);

    await chooseDefault();
    await act(async () => buttons("Tangerine Cream 적용")[0].click());
    expect(adminThemeApi.activateDefault).toHaveBeenCalledOnce();

    await chooseMay();
    await act(async () => buttons("Coastal Sunset 적용")[0].click());
    expect(adminThemeApi.create).toHaveBeenCalledOnce();
    expect(adminThemeApi.activate).toHaveBeenCalledTimes(2);
  });

  it("keeps the active theme and colors if default activation fails", async () => {
    vi.mocked(adminThemeApi.activateDefault).mockRejectedValue(new Error("offline"));
    document.documentElement.style.setProperty("--theme-brand-primary", "#123456");
    await render();
    await chooseDefault();
    await act(async () => { buttons("Tangerine Cream 적용")[0].click(); });
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#123456");
    expect(host.querySelector('[aria-label="현재 활성 테마"]')?.textContent).toContain("활성 축제");
    expect(toastMock.error).toHaveBeenCalledWith("테마 적용에 실패했습니다.");
  });

  it("can copy the default without updating it and respects unsaved edits when selecting it", async () => {
    await render();
    await setInput("Primary HEX", "#123456");
    vi.spyOn(window, "confirm").mockReturnValue(false);
    await chooseDefault();
    expect(host.querySelector<HTMLInputElement>('[aria-label="Primary HEX"]')?.value).toBe("#123456");
    vi.mocked(window.confirm).mockReturnValue(true);
    await chooseDefault();
    await act(async () => { buttons("복제")[0].click(); });
    expect(host.querySelector<HTMLInputElement>('[aria-label="테마 이름"]')?.value).toBe("Tangerine Cream 복제");
    await setInput("Primary HEX", "#123456");
    await act(async () => { buttons("저장")[0].click(); });
    expect(adminThemeApi.create).toHaveBeenCalledWith(expect.objectContaining({name: "Tangerine Cream 복제", themeData: {
      ...getDefaultThemeData(), brand: { ...getDefaultThemeData().brand, primary: "#123456" }, category: { ...getDefaultThemeData().category, pub: "#123456" },
    }}));
    expect(adminThemeApi.update).not.toHaveBeenCalled();
    expect(adminThemeApi.activateDefault).not.toHaveBeenCalled();
  });

  const actionBackground = () => host.querySelector<HTMLElement>('[data-testid="admin-theme-action-scope"]')?.style.getPropertyValue("--admin-theme-action-bg");

  it.each(["#7546b7", "#3274d9"]) ("uses the active %s strong color for admin actions, not the selected draft", async (strong) => {
    const themedActive = { ...active, themeData: { ...colors, brand: { ...colors.brand, strong } } };
    vi.mocked(adminThemeApi.list).mockResolvedValue([themedActive, inactive]);
    vi.mocked(adminThemeApi.get).mockImplementation(async (id) => id === 2 ? inactive : themedActive);
    await render();
    const expected = (createAdminThemeActionStyle(strong) as Record<string, string>)["--admin-theme-action-bg"];
    expect(actionBackground()).toBe(expected);
    await act(async () => { buttons("저장된 테마")[0].click(); });
    expect(buttons("저장된 테마 적용")[0].className).toContain("border-[var(--admin-theme-action-outline)]");
    await setInput("Primary HEX", "#123456");
    await setInput("Strong · 진한 브랜드 컬러 HEX", "#fedcba");
    expect(actionBackground()).toBe(expected);
    expect(document.documentElement.style.getPropertyValue("--theme-brand-strong")).toBe("");
    await act(async () => { buttons("편집 중인 화면 확인")[0].click(); });
    expect(actionBackground()).toBe(expected);
    await act(async () => { document.querySelector<HTMLButtonElement>('[role="dialog"] button')?.click(); });
    expect(actionBackground()).toBe(expected);
  });

  it("updates admin action colors only after an inactive theme is activated", async () => {
    const purple = { ...active, themeData: { ...colors, brand: { ...colors.brand, strong: "#7546b7" } } };
    const blue = { ...inactive, themeData: { ...colors, brand: { ...colors.brand, strong: "#3274d9" } } };
    vi.mocked(adminThemeApi.list).mockResolvedValue([purple, blue]);
    vi.mocked(adminThemeApi.get).mockImplementation(async (id) => id === 2 ? blue : purple);
    vi.mocked(adminThemeApi.activate).mockResolvedValue({ ...blue, active: true });
    await render();
    const before = actionBackground();
    await act(async () => { buttons("저장된 테마")[0].click(); });
    expect(actionBackground()).toBe(before);
    await act(async () => { buttons("저장된 테마 적용")[0].click(); });
    expect(actionBackground()).toBe((createAdminThemeActionStyle("#3274d9") as Record<string, string>)["--admin-theme-action-bg"]);
    expect(document.documentElement.style.getPropertyValue("--theme-brand-strong")).toBe("#3274d9");
    expect(buttons("삭제")[0].className).toContain("border-[var(--ds-admin-action-danger)]");
  });

  it("uses the bundled root Theme Core when no active theme can be loaded", async () => {
    vi.mocked(adminThemeApi.list).mockRejectedValue(new Error("offline"));
    document.documentElement.style.setProperty("--theme-brand-strong", "#7546b7");
    await render();
    expect(actionBackground()).toBe((createAdminThemeActionStyle("#7546b7") as Record<string, string>)["--admin-theme-action-bg"]);
  });

  async function prepareRecommendation() {
    vi.mocked(festivalBrandingApi.get).mockResolvedValue({ festivalSettingId: 1,
      posterImageUrl: "https://cdn.example.com/poster.png", logoImageUrl: null });
    vi.mocked(festivalBrandingApi.extractPosterColors).mockResolvedValue({ colors: [
      { hex: "#4EB15E", population: 0.6 }, { hex: "#13730C", population: 0.2 },
    ] });
    await render();
    expect(buttons("다시 추천받기")[0].disabled).toBe(true);
    await act(async () => { buttons("대표색 추출")[0].click(); });
    expect(buttons("다시 추천받기")[0].disabled).toBe(true);
    await act(async () => { host.querySelector<HTMLButtonElement>('button[aria-label="기준 색상 #4EB15E 선택"]')!.click(); });
    expect(buttons("다시 추천받기")[0].disabled).toBe(false);
  }

  it("automatically recommends after color selection, reuses crops, and only publishes on full apply", async () => {
    await prepareRecommendation();
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 650)); });
    expect(adminThemeApi.recommend).toHaveBeenCalledTimes(1);
    expect(recommendPosterBackground).toHaveBeenCalledTimes(2);
    expect(adminThemeApi.applyBundle).not.toHaveBeenCalled();
    expect(buttons("추천 화면 확인")).toHaveLength(0);
    expect(host.querySelector('[aria-label="화면 확인과 테마 작업 안내"] button')).toBeNull();
    expect((host.querySelector("#theme-management") as HTMLDetailsElement).open).toBe(true);
    expect(getTicketCardBackgroundImageUrl()).toBeNull();
    await act(async () => host.querySelector<HTMLButtonElement>('button[aria-label="기준 색상 #13730C 선택"]')!.click());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 650)); });
    expect(adminThemeApi.recommend).toHaveBeenCalledTimes(2);
    expect(recommendPosterBackground).toHaveBeenCalledTimes(2);
    await act(async () => buttons("이 시안 선택")[0].click());
    expect(buttons("추천 화면 확인")[0].closest("#theme-apply")).not.toBeNull();
    expect(buttons("전체 적용")[0].disabled).toBe(false);
    await act(async () => buttons("전체 적용")[0].click());
    expect(adminThemeApi.applyBundle).toHaveBeenCalledWith(expect.objectContaining({ selectedBaseColor: "#13730C", sourcePosterUrl: "https://cdn.example.com/poster.png", ticketCardBackgroundImageUrl: "https://cdn.example.com/poster-ai-ticket.jpg", ticketingBackgroundImageUrl: "https://cdn.example.com/poster-ai-closed.jpg" }));
    expect(vi.mocked(adminThemeApi.applyBundle).mock.calls[0][0]).not.toHaveProperty("homeBanner");
    const appliedColors = vi.mocked(adminThemeApi.applyBundle).mock.calls[0][0].themeData;
    expect(appliedColors.category).toEqual({ ...colors.category, pub: appliedColors.brand.primary });
    expect(appliedColors.status).toEqual(colors.status);
    expect(getTicketingBackgroundImageUrl()).toBe("https://cdn.example.com/poster-ai-closed.jpg");
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#4EB15E");
    expect(adminThemeApi.activate).not.toHaveBeenCalled();
  });

  it("saves only the first home image without recommendations or ticketing permission and reuses staged upload after failure", async () => {
    permissions.role = "manager"; permissions.permissions = ["OPERATIONS"];
    vi.mocked(festivalBrandingApi.get).mockResolvedValue({ festivalSettingId: 1, posterImageUrl: "https://cdn.example.com/poster.png", logoImageUrl: null });
    vi.mocked(adminHomeImageApi.replaceFirst).mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ id: 7, imageUrl: "https://cdn.example.com/new-home.jpg", displayOrder: 0 });
    await render();
    await act(async () => buttons("공식 포스터로 편집")[0].click());
    await act(async () => buttons("편집 결과 미리보기")[0].click());
    await act(async () => buttons("홈화면 이미지 저장")[0].click());
    expect(host.textContent).toContain("선택한 이미지는 유지됩니다");
    await act(async () => buttons("홈화면 이미지 저장")[0].click());
    expect(adminHomeImageApi.stageUpload).toHaveBeenCalledOnce();
    expect(adminHomeImageApi.replaceFirst).toHaveBeenCalledTimes(2);
    expect(adminHomeImageApi.replaceFirst).toHaveBeenLastCalledWith({ imageUrl: "https://cdn.example.com/new-home.jpg", expectedFirstImageId: 7, expectedFirstImageUrl: "/existing-home.jpg", sourcePosterUrl: "https://cdn.example.com/poster.png" });
    expect(adminThemeApi.recommend).not.toHaveBeenCalled();
    expect(adminThemeApi.applyBundle).not.toHaveBeenCalled();
    expect(uploadTicketingBackground).not.toHaveBeenCalled();
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
    expect(buttons("홈화면 이미지 저장")).toHaveLength(0);
    expect(host.textContent).toContain("홈 이미지가 저장되었습니다");
  });

  it("does not stage or save an unsaved home image when applying a recommendation bundle", async () => {
    await prepareRecommendation();
    await act(async () => buttons("다시 추천받기")[0].click());
    await act(async () => buttons("이 시안 선택")[0].click());
    await act(async () => buttons("공식 포스터로 편집")[0].click());
    await act(async () => buttons("편집 결과 미리보기")[0].click());
    expect(adminHomeImageApi.stageUpload).not.toHaveBeenCalled();
    expect(adminThemeApi.applyBundle).not.toHaveBeenCalled();
    await act(async () => buttons("추천 화면 확인")[0].click());
    const preview = document.querySelector('[role="dialog"]')!;
    await act(async () => [...preview.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(tab => tab.textContent === "홈")!.click());
    expect(preview.querySelector<HTMLImageElement>('img[alt="홈 대표 이미지 미리보기"]')?.getAttribute("src")).toBe("/existing-home.jpg");
    await act(async () => [...preview.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.trim() === "닫기")!.click());
    await act(async () => buttons("전체 적용")[0].click());
    expect(adminHomeImageApi.stageUpload).not.toHaveBeenCalled();
    expect(vi.mocked(adminThemeApi.applyBundle).mock.calls[0][0]).not.toHaveProperty("homeBanner");
    expect(buttons("홈화면 이미지 저장")).toHaveLength(1);
  });

  it("does not block full apply when the home image list cannot be loaded", async () => {
    vi.mocked(adminHomeImageApi.list).mockRejectedValueOnce(new Error("home images unavailable"));
    await prepareRecommendation();
    await act(async () => buttons("다시 추천받기")[0].click());
    await act(async () => buttons("이 시안 선택")[0].click());
    await act(async () => buttons("전체 적용")[0].click());
    expect(adminThemeApi.applyBundle).toHaveBeenCalledOnce();
    expect(adminHomeImageApi.stageUpload).not.toHaveBeenCalled();
  });

  it("reports only the official poster when bundle apply detects a conflict", async () => {
    await prepareRecommendation();
    await act(async () => buttons("다시 추천받기")[0].click());
    await act(async () => buttons("이 시안 선택")[0].click());
    vi.mocked(adminThemeApi.applyBundle).mockRejectedValueOnce({ status: 409 });
    await act(async () => buttons("전체 적용")[0].click());
    expect(toastMock.error).toHaveBeenCalledWith("공식 포스터가 변경되었습니다. 새로고침 후 다시 확인해 주세요.");
    expect(getTicketingBackgroundImageUrl()).toBeNull();
    expect(adminHomeImageApi.stageUpload).not.toHaveBeenCalled();
  });

  it.each(["apply", "switch"] as const)("preserves the edited recommendation bundle on Save, then handles %s", async nextAction => {
    await prepareRecommendation();
    await act(async () => buttons("다시 추천받기")[0].click());
    await act(async () => buttons("이 시안 선택")[0].click());
    await setInput("테마 이름", "수정한 추천 테마");
    await setInput("Primary HEX", "#123456");
    await act(async () => buttons("저장")[0].click());
    expect(buttons("전체 적용")[0].disabled).toBe(false);
    expect(host.querySelector<HTMLInputElement>('input[aria-label="테마 이름"]')!.value).toBe("수정한 추천 테마");
    expect(host.querySelector<HTMLInputElement>('input[aria-label="Primary HEX"]')!.value).toBe("#123456");
    expect(getTicketingBackgroundImageUrl()).toBeNull();
    expect(uploadTicketingBackground).not.toHaveBeenCalled();
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
    if (nextAction === "apply") {
      await act(async () => buttons("추천 화면 확인")[0].click());
      const preview = document.querySelector('[data-testid="theme-screen-preview"]')!;
      await act(async () => [...preview.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(tab => tab.textContent === "내 정보")!.click());
      expect(preview.querySelector('img[alt="내 정보 추천 배경"]')?.getAttribute("src")).toBe("data:image/jpeg;base64,/9j/2Q==");
      await act(async () => document.querySelector<HTMLButtonElement>('[role="dialog"] button')!.click());
      await act(async () => buttons("전체 적용")[0].click());
      expect(adminThemeApi.applyBundle).toHaveBeenCalledWith(expect.objectContaining({
        name: "수정한 추천 테마",
        themeData: expect.objectContaining({ brand: expect.objectContaining({ primary: "#123456" }) }),
        sourcePosterUrl: "https://cdn.example.com/poster.png",
        selectedBaseColor: "#4EB15E",
        ticketCardBackgroundImageUrl: "https://cdn.example.com/poster-ai-ticket.jpg",
        ticketingBackgroundImageUrl: "https://cdn.example.com/poster-ai-closed.jpg",
      }));
      expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#123456");
      expect(getTicketingBackgroundImageUrl()).toBe("https://cdn.example.com/poster-ai-closed.jpg");
    } else {
      await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="저장된 테마 목록"] button[aria-pressed="false"]')!.click());
      expect(buttons("전체 적용")).toHaveLength(0);
      expect(buttons("추천 화면 확인")).toHaveLength(0);
      expect(adminThemeApi.applyBundle).not.toHaveBeenCalled();
    }
  });

  it.each(["success", "failure"] as const)("locks draft inputs through deferred uploads and full apply %s", async outcome => {
    await prepareRecommendation();
    await act(async () => buttons("다시 추천받기")[0].click());
    await act(async () => buttons("이 시안 선택")[0].click());
    const editableLabels = ["테마 이름", ...THEME_FIELDS[0].colors.flatMap(([, label]) => [`${label} HEX`, `${label} 색상 선택`])];
    const editableInputs = () => Array.from(host.querySelectorAll<HTMLInputElement>('[aria-label="테마 편집"] input')).filter(input => editableLabels.includes(input.getAttribute("aria-label") ?? ""));
    expect(editableInputs().length).toBeGreaterThan(3);
    expect(editableInputs().every(input => !input.disabled)).toBe(true);
    const uploads: Array<() => void> = [];
    vi.mocked(uploadTicketingBackground).mockImplementation(file => new Promise(resolve => {
      uploads.push(() => resolve({ url: `https://cdn.example.com/${file.name}` }));
    }));
    let completeApply!: () => void;
    vi.mocked(adminThemeApi.applyBundle).mockImplementation(payload => new Promise((resolve, reject) => {
      completeApply = () => outcome === "success"
        ? resolve({ ...active, id: 99, name: payload.name, themeData: payload.themeData })
        : reject(new Error("apply failed"));
    }));
    await act(async () => buttons("전체 적용")[0].click());
    expect(uploads).toHaveLength(2);
    expect(editableInputs().every(input => input.disabled)).toBe(true);
    expect(adminThemeApi.applyBundle).not.toHaveBeenCalled();
    await act(async () => uploads[0]());
    expect(editableInputs().every(input => input.disabled)).toBe(true);
    expect(adminThemeApi.applyBundle).not.toHaveBeenCalled();
    await act(async () => uploads[1]());
    expect(editableInputs().every(input => input.disabled)).toBe(true);
    expect(adminThemeApi.applyBundle).toHaveBeenCalledOnce();
    expect(getTicketCardBackgroundImageUrl()).toBeNull();
    await act(async () => completeApply());
    expect(editableInputs().every(input => !input.disabled)).toBe(true);
    expect(host.querySelector<HTMLInputElement>('input[aria-label="테마 이름"]')!.value).toBe("Balanced AI 추천 테마");
    expect(getTicketCardBackgroundImageUrl()).toBe(outcome === "success" ? "https://cdn.example.com/poster-ai-ticket.jpg" : null);
  });

  it("switches preview tabs with saved ticketing state while retaining both crops for apply", async () => {
    await prepareRecommendation();
    await act(async () => buttons("다시 추천받기")[0].click());
    await act(async () => buttons("이 시안 선택")[0].click());
    await act(async () => buttons("추천 화면 확인")[0].click());
    const preview = document.querySelector('[data-testid="theme-screen-preview"]')!;
    const tabs = () => [...preview.querySelectorAll('[role="tab"]')].map(tab => tab.textContent);
    expect(tabs()).toEqual(["홈", "부스맵", "티켓팅", "발급 티켓", "내 정보"]);
    await act(async () => setTicketingEnabled(false));
    expect(tabs()).toEqual(["홈", "부스맵", "OFF 안내", "내 정보"]);
    await act(async () => setTicketingEnabled(true));
    expect(tabs()).toEqual(["홈", "부스맵", "티켓팅", "발급 티켓", "내 정보"]);
    await act(async () => document.querySelector<HTMLButtonElement>('[role="dialog"] button')!.click());
    expect(recommendPosterBackground).toHaveBeenCalledTimes(2);
    await act(async () => buttons("전체 적용")[0].click());
    expect(uploadTicketingBackground).toHaveBeenCalledTimes(2);
    expect(getTicketCardBackgroundImageUrl()).toBe("https://cdn.example.com/poster-ai-ticket.jpg");
    expect(getTicketingBackgroundImageUrl()).toBe("https://cdn.example.com/poster-ai-closed.jpg");
  });

  it("previews the recommended portrait in my info without publishing either background", async () => {
    await prepareRecommendation();
    await act(async () => {
      setTicketingBackgroundImageUrl("https://cdn.example.com/saved-portrait.jpg");
      setTicketCardBackgroundImageUrl("https://cdn.example.com/saved-ticket.jpg");
      buttons("다시 추천받기")[0].click();
    });
    await act(async () => buttons("이 시안 선택")[0].click());
    await act(async () => buttons("추천 화면 확인")[0].click());
    const preview = document.querySelector('[data-testid="theme-screen-preview"]')!;
    const myInfo = [...preview.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(tab => tab.textContent === "내 정보")!;
    await act(async () => myInfo.click());
    expect(preview.querySelector('img[alt="내 정보 추천 배경"]')?.getAttribute("src")).toBe("data:image/jpeg;base64,/9j/2Q==");
    expect(getTicketingBackgroundImageUrl()).toBe("https://cdn.example.com/saved-portrait.jpg");
    expect(getTicketCardBackgroundImageUrl()).toBe("https://cdn.example.com/saved-ticket.jpg");
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
    expect(uploadTicketingBackground).not.toHaveBeenCalled();
    expect(adminThemeApi.applyBundle).not.toHaveBeenCalled();
  });

  it("falls back to map when saved ticketing turns OFF while the issued preview is active", async () => {
    await render();
    await act(async () => buttons("편집 중인 화면 확인")[0].click());
    const preview = document.querySelector('[data-testid="theme-screen-preview"]')!;
    const issued = [...preview.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(tab => tab.textContent === "발급 티켓")!;
    await act(async () => issued.click());
    expect(preview.querySelector('[role="tabpanel"]')?.getAttribute("aria-label")).toBe("발급 티켓 화면 샘플");
    await act(async () => setTicketingEnabled(false));
    expect([...preview.querySelectorAll('[role="tab"]')].map(tab => tab.textContent)).toEqual(["홈", "부스맵", "OFF 안내", "내 정보"]);
    expect(preview.querySelector('[role="tabpanel"]')?.getAttribute("aria-label")).toBe("부스맵 화면 샘플");
    expect(preview.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe("부스맵");
    expect(preview.textContent).not.toContain("발급 예시");
  });

  it("ignores an old color recommendation after a newer selection", async () => {
    await prepareRecommendation();
    let resolveOld!: (result: ThemeRecommendationResponse) => void;
    vi.mocked(adminThemeApi.recommend).mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
    await act(async () => buttons("다시 추천받기")[0].click());
    const signal = vi.mocked(adminThemeApi.recommend).mock.calls[0][1]!;
    await act(async () => host.querySelector<HTMLButtonElement>('button[aria-label="기준 색상 #13730C 선택"]')!.click());
    expect(signal.aborted).toBe(true);
    await act(async () => buttons("다시 추천받기")[0].click());
    await act(async () => resolveOld({ candidates: [{ ...recommendation.candidates[0], themeData: { ...colors, brand: { ...colors.brand, primary: "#000001" } } }] }));
    expect(host.querySelector('[aria-label="원본형 시안"]')?.getAttribute("style")).toContain("#4EB15E");
    expect(host.querySelector('[aria-label="원본형 시안"]')?.getAttribute("style")).not.toContain("#000001");
  });

  it("retries only a failed background while retaining the chosen palette", async () => {
    vi.mocked(recommendPosterBackground).mockImplementation(async (target, _signal, sourcePosterUrl) => {
      if (target === "closed") throw new Error("일시 오류");
      return { target, sourcePosterUrl, mimeType: "image/jpeg", imageBase64: "/9j/2Q==", width: 800, height: 360, focusX: .5, focusY: .5, reason: "여백" };
    });
    await prepareRecommendation();
    await act(async () => buttons("다시 추천받기")[0].click());
    await act(async () => buttons("이 시안 선택")[0].click());
    expect(buttons("전체 적용")).toHaveLength(0);
    vi.mocked(recommendPosterBackground).mockImplementation(async (target, _signal, sourcePosterUrl) => ({ target, sourcePosterUrl, mimeType: "image/jpeg", imageBase64: "/9j/2Q==", width: 800, height: 360, focusX: .5, focusY: .5, reason: "여백" }));
    await act(async () => buttons("배경만 다시 추천")[0].click());
    expect(adminThemeApi.recommend).toHaveBeenCalledTimes(1);
    expect(recommendPosterBackground).toHaveBeenCalledTimes(3);
    expect(buttons("전체 적용")[0].disabled).toBe(false);
  });

  it("does not request ticket backgrounds without ticketing permission", async () => {
    permissions.role = "manager"; permissions.permissions = ["OPERATIONS"];
    await prepareRecommendation();
    await act(async () => buttons("다시 추천받기")[0].click());
    expect(recommendPosterBackground).not.toHaveBeenCalled();
    expect(buttons("전체 적용")).toHaveLength(0);
    expect(host.textContent).toContain("축제 운영과 티켓팅 권한이 모두 필요");
  });

  it("keeps live colors and backgrounds unchanged when full apply fails", async () => {
    await prepareRecommendation();
    await act(async () => buttons("다시 추천받기")[0].click());
    await act(async () => buttons("이 시안 선택")[0].click());
    vi.mocked(adminThemeApi.applyBundle).mockRejectedValue(new Error("포스터 변경"));
    await act(async () => buttons("전체 적용")[0].click());
    expect(getTicketCardBackgroundImageUrl()).toBeNull();
    expect(getTicketingBackgroundImageUrl()).toBeNull();
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
    expect(buttons("전체 적용")[0].disabled).toBe(false);
  });

  it("shows three candidates without changing the draft, then applies only the chosen candidate and saves provenance", async () => {
    await prepareRecommendation();
    const actionColorBefore = actionBackground();
    const before = host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style");
    await act(async () => { buttons("다시 추천받기")[0].click(); });
    expect(adminThemeApi.recommend).toHaveBeenCalledWith({
      sourceColors: ["#4EB15E", "#13730C"], selectedBaseColor: "#4EB15E",
    }, expect.any(AbortSignal));
    expect(host.querySelector('[aria-label="AI 추천 작업 단계"] li:last-child')?.getAttribute("data-state")).toBe("completed");
    expect(host.querySelectorAll('[aria-label$="시안"]')).toHaveLength(4);
    expect(host.querySelector('[aria-label="원본형 시안"]')?.textContent).toContain("포스터의 색감과 분위기를 가장 충실하게 반영한 시안입니다.");
    expect(host.querySelector('[aria-label="라이트형 시안"]')?.textContent).toContain("같은 색조를 유지하면서 더 밝고 경쾌하게 조정한 시안입니다.");
    expect(host.querySelector('[aria-label="딥톤형 시안"]')?.textContent).toContain("같은 색조를 유지하면서 더 진하고 선명한 대비를 살린 시안입니다.");
    expect(host.querySelector('[aria-label="라이트형 시안"]')?.textContent).not.toContain("Vibrant");
    expect(host.querySelector('[aria-label="AI 추천 시안"]')?.previousElementSibling?.getAttribute("aria-label")).toBe("축제 브랜딩");
    expect(host.querySelector('[aria-label="AI 추천 시안"]')!.compareDocumentPosition(host.querySelector('[aria-label="현재 활성 테마"]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(host.querySelector('[aria-label="현재 활성 테마"]')!.compareDocumentPosition(host.querySelector('[aria-label="테마 편집"]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(host.querySelector('[aria-label="저장된 테마 목록"]')!.compareDocumentPosition(host.querySelector('[aria-label="테마 편집"]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(host.querySelector('[aria-label="저장된 테마 목록"]')?.parentElement?.parentElement?.className).toContain("lg:grid-cols-");
    expect(host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style")).toBe(before);
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
    expect(adminThemeApi.create).not.toHaveBeenCalled();
    expect(adminThemeApi.activate).not.toHaveBeenCalled();
    await act(async () => { buttons("이 시안 선택")[0].click(); });
    expect(actionBackground()).toBe(actionColorBefore);
    expect(host.querySelector('[aria-label="원본형 시안"]')?.getAttribute("data-selected")).toBe("true");
    expect(host.querySelector('[aria-label="원본형 시안"]')?.textContent).toContain("편집 시안 선택됨");
    expect(host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style")).toContain("--preview-brand-primary: #4EB15E");
    await setInput("Primary HEX", "#123456");
    await act(async () => { buttons("저장")[0].click(); });
    expect(adminThemeApi.create).toHaveBeenCalledWith(expect.objectContaining({
      themeData: expect.objectContaining({ brand: expect.objectContaining({ primary: "#123456" }) }),
      sourcePosterUrl: "https://cdn.example.com/poster.png",
      sourceColors: ["#4EB15E", "#13730C"], selectedBaseColor: "#4EB15E",
    }));
    expect(adminThemeApi.activate).not.toHaveBeenCalled();
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
  });

  it("allows choosing another candidate and keeps the draft when re-recommending", async () => {
    await prepareRecommendation();
    await act(async () => { buttons("다시 추천받기")[0].click(); });
    await act(async () => { buttons("이 시안 선택")[1].click(); });
    expect(host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style")).toContain("--preview-brand-primary: #F69324");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await act(async () => { buttons("이 시안 선택")[2].click(); });
    expect(host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style")).toContain("--preview-brand-primary: #983508");
    const replacement: ThemeRecommendationResponse = { candidates: recommendation.candidates.map((candidate) => ({
      ...candidate, themeData: { ...candidate.themeData, brand: { ...candidate.themeData.brand, primary: "#123456" } },
    })) };
    vi.mocked(adminThemeApi.recommend).mockResolvedValue(replacement);
    await act(async () => { buttons("다시 추천받기")[0].click(); });
    expect(host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style")).toContain("--preview-brand-primary: #983508");
    expect(host.querySelectorAll('[aria-label$="시안"]')).toHaveLength(4);
    expect(host.querySelector('[aria-label="원본형 시안"]')?.getAttribute("style")).toContain("--preview-brand-primary: #123456");
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
  });

  it.each(["balanced", "vibrant", "deep"] as const)("renders two candidates when %s is filtered out", async (missing) => {
    vi.mocked(adminThemeApi.recommend).mockResolvedValue({
      candidates: recommendation.candidates.filter((candidate) => candidate.id !== missing),
    });
    await prepareRecommendation();
    const recommendButton = Array.from(host.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("다시 추천받기"));
    expect(recommendButton).toBeDefined();
    await act(async () => { recommendButton!.click(); });

    const comparison = host.querySelector('[aria-label="AI 추천 시안"]')!;
    const cards = Array.from(comparison.querySelectorAll("article"));
    expect(cards).toHaveLength(2);
    expect(comparison.querySelector(".lg\\:grid-cols-2")).not.toBeNull();
    expect(comparison.textContent).toContain("유효한 시안만 표시합니다");
    expect(cards.map((card) => card.getAttribute("aria-label"))).not.toContain(`${missing} 시안`);
    const expectedPrimary = recommendation.candidates.find((candidate) => candidate.id !== missing)!.themeData.brand.primary;
    await act(async () => { cards[0].querySelector("button")!.click(); });
    expect(host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style"))
      .toContain(`--preview-brand-primary: ${expectedPrimary}`);
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
    expect(adminThemeApi.activate).not.toHaveBeenCalled();
  });

  it("renders one valid candidate and preserves the draft preview and provenance when saving", async () => {
    vi.mocked(adminThemeApi.recommend).mockResolvedValue({ candidates: [recommendation.candidates[1]] });
    await prepareRecommendation();
    await act(async () => { buttons("다시 추천받기")[0].click(); });
    const comparison = host.querySelector('[aria-label="AI 추천 시안"]')!;
    expect(comparison.querySelectorAll("article")).toHaveLength(1);
    expect(comparison.querySelector(".lg\\:grid-cols-3")).toBeNull();
    expect(comparison.textContent).toContain("유효한 시안만 표시합니다");
    await act(async () => { buttons("이 시안 선택")[0].click(); });
    expect(host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style"))
      .toContain("--preview-brand-primary: #F69324");
    await act(async () => { buttons("추천 화면 확인")[0].click(); });
    expect(document.querySelector('[data-testid="theme-screen-preview"] [role="tabpanel"]')?.getAttribute("style"))
      .toContain("--theme-brand-primary: #F69324");
    await act(async () => { document.querySelector<HTMLButtonElement>('[role="dialog"] button')?.click(); });
    await act(async () => { buttons("저장")[0].click(); });
    expect(adminThemeApi.create).toHaveBeenCalledWith(expect.objectContaining({
      themeData: expect.objectContaining({ brand: expect.objectContaining({ primary: "#F69324" }) }),
      selectedBaseColor: "#4EB15E",
      sourceColors: ["#4EB15E", "#13730C"],
    }));
    expect(adminThemeApi.activate).not.toHaveBeenCalled();
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
  });

  it("keeps the draft but disables applying stale candidates after a failed new recommendation", async () => {
    await prepareRecommendation();
    await act(async () => { buttons("다시 추천받기")[0].click(); });
    await act(async () => { buttons("이 시안 선택")[0].click(); });
    const before = host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style");
    vi.mocked(adminThemeApi.recommend).mockRejectedValue({ status: 502, payload: { code: "AI_THEME_DIVERSITY_FAILED" } });
    await act(async () => { buttons("다시 추천받기")[0].click(); });
    expect(host.querySelectorAll('[aria-label$="시안"]')).toHaveLength(0);
    expect(host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style")).toBe(before);
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("색상 차이");
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
  });

  it("explains a temporary AI validation failure without exposing validator rules", async () => {
    await prepareRecommendation();
    vi.mocked(adminThemeApi.recommend).mockRejectedValue({ status: 502, payload: { code: "AI_THEME_VALIDATION_FAILED" } });
    await act(async () => { buttons("다시 추천받기")[0].click(); });
    const message = host.querySelector('[role="alert"]')?.textContent ?? "";
    expect(message).toContain("일시적으로 색상 기준을 충족하지 못할 수 있습니다");
    expect(message).toContain("다시 시도하면 새로운 시안");
    expect(message).not.toContain("CATEGORY_DISTANCE");
  });

  it("shows only map, OFF notice and my info tabs when saved ticketing is OFF", async () => {
    setTicketingEnabled(false);
    vi.mocked(festivalBrandingApi.get).mockResolvedValue({ festivalSettingId: 1, posterImageUrl: "/official-poster.jpg", logoImageUrl: "/official-logo.png" });
    await render();
    await act(async () => { buttons("편집 중인 화면 확인")[0].click(); });
    const preview = document.querySelector('[data-testid="theme-screen-preview"]')!;
    await act(async () => { [...preview.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(tab => tab.textContent === "OFF 안내")!.click(); });
    expect(preview.querySelector('section[aria-labelledby="service-closed-title"] img[alt="축제 로고"]')?.getAttribute("src")).toBe("/official-logo.png");
    expect(preview.textContent).toContain("현재 티켓팅 OFF");
    expect(preview.textContent).not.toContain("DAY 1 공연 티켓팅");
    expect([...preview.querySelectorAll('[role="tab"]')].map(tab => tab.textContent)).toEqual(["홈", "부스맵", "OFF 안내", "내 정보"]);
  });

  it("keeps the mobile preview scoped while switching map and ticketing tabs", async () => {
    await render();
    expect(host.querySelector('[data-testid="theme-screen-preview"]')).toBeNull();
    await act(async () => { buttons("편집 중인 화면 확인")[0].click(); });
    const preview = document.querySelector('[data-testid="theme-screen-preview"]')!;
    expect([...preview.querySelectorAll('[role="tab"]')].map(tab => tab.textContent)).toEqual(["홈", "부스맵", "티켓팅", "발급 티켓", "내 정보"]);
    expect(host.querySelector('[data-testid="theme-preview"]')?.contains(preview)).toBe(false);
    expect(preview.querySelector('[role="tabpanel"]')?.getAttribute("aria-label")).toBe("부스맵 화면 샘플");
    expect(preview.querySelector('img[alt="LEGEND"]')).not.toBeNull();
    expect(preview.textContent).toContain("5.14 THU");
    expect(preview.textContent).toContain("Food Truck");
    expect(preview.querySelector('[aria-label="부스맵 목록 샘플"]')).not.toBeNull();
    expect(preview.querySelectorAll('[aria-label$="마커 샘플"]')).toHaveLength(6);
    expect(preview.querySelector('[role="tabpanel"]')?.className).toContain("max-w-[430px]");
    expect(preview.querySelector('[role="tabpanel"]')?.getAttribute("style")).toContain("--theme-brand-primary: #ff642d");
    await act(async () => { [...preview.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(tab => tab.textContent === "티켓팅")!.click(); });
    expect(preview.querySelector('[role="tabpanel"]')?.getAttribute("aria-label")).toBe("티켓팅 화면 샘플");
    expect(preview.querySelector('[role="tabpanel"]')?.getAttribute("data-color-scheme")).toBe("webapp");
    expect(preview.textContent).toContain("요일별 예매 오픈시간을 확인하여 티켓팅에 참여하세요.");
    expect(preview.textContent).toContain("DAY 1 공연 티켓팅");
    expect(preview.textContent).toContain("DAY 2 공연 티켓팅");
    expect(preview.textContent).toContain("실시간 예매 중");
    expect(preview.textContent).toContain("오픈 예정");
    expect(preview.textContent).toContain("단국존 선착순 예매");
    expect(preview.querySelectorAll('[role="tab"][aria-selected="true"]')).toHaveLength(1);
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
    await act(async () => { document.querySelector<HTMLButtonElement>('[role="dialog"] button')?.click(); });
    await setInput("Primary HEX", "#123456");
    await act(async () => { buttons("편집 중인 화면 확인")[0].click(); });
    expect(document.querySelector('[data-testid="theme-screen-preview"] [role="tabpanel"]')?.getAttribute("style")).toContain("--theme-brand-primary: #123456");
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
  });

  it("reuses branding for both preview tabs and updates the logo after upload without changing the draft", async () => {
    const oldLogo = "https://cdn.example.com/old-logo.png";
    const newLogo = "https://cdn.example.com/new-logo.png";
    vi.mocked(festivalBrandingApi.get).mockResolvedValue({ festivalSettingId: 1, posterImageUrl: null, logoImageUrl: oldLogo });
    vi.mocked(festivalBrandingApi.upload).mockResolvedValue({ festivalSettingId: 1, posterImageUrl: null, logoImageUrl: newLogo });
    await render();
    await act(async () => { host.querySelector("svg.lucide-monitor-smartphone")!.closest("button")!.click(); });
    const preview = document.querySelector('[data-testid="theme-screen-preview"]')!;
    const logo = () => preview.querySelector<HTMLImageElement>("header img")!;
    expect(logo().getAttribute("src")).toBe(oldLogo);
    expect(festivalBrandingApi.get).toHaveBeenCalledTimes(1);
    const themeBefore = preview.querySelector('[role="tabpanel"]')?.getAttribute("style");

    const logoInput = host.querySelectorAll<HTMLInputElement>('input[type="file"][accept="image/jpeg,image/png"]')[1];
    Object.defineProperty(logoInput, "files", { configurable: true, value: [new File(["png"], "logo.png", { type: "image/png" })] });
    await act(async () => { logoInput.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(logo().getAttribute("src")).toBe(newLogo);
    expect(preview.querySelector('[role="tabpanel"]')?.getAttribute("style")).toBe(themeBefore);
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
    expect(adminThemeApi.update).not.toHaveBeenCalled();
    expect(adminThemeApi.activate).not.toHaveBeenCalled();
    expect(festivalBrandingApi.get).toHaveBeenCalledTimes(1);

    await act(async () => { [...preview.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(tab => tab.textContent === "티켓팅")!.click(); });
    expect(logo().getAttribute("src")).toBe(newLogo);
    expect(logo().className).toContain("object-contain");
    await act(async () => { logo().dispatchEvent(new Event("error")); });
    expect(logo().getAttribute("src")).toBe("/legend-logo.png");
  });

  it("uses the default preview logo when branding lookup fails", async () => {
    vi.mocked(festivalBrandingApi.get).mockRejectedValue(new Error("network error"));
    await render();
    await act(async () => { host.querySelector("svg.lucide-monitor-smartphone")!.closest("button")!.click(); });
    const preview = document.querySelector('[data-testid="theme-screen-preview"]')!;
    expect(preview.querySelector("header img")?.getAttribute("src")).toBe("/legend-logo.png");
    await act(async () => { [...preview.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(tab => tab.textContent === "티켓팅")!.click(); });
    expect(preview.querySelector("header img")?.getAttribute("src")).toBe("/legend-logo.png");
  });

  it("keeps the preview modal separate from the draft and restores focus on Escape", async () => {
    await render();
    const trigger = buttons("편집 중인 화면 확인")[0];
    trigger.focus();
    await act(async () => { trigger.click(); });
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain("전체 적용 전에는 사용자 화면이 바뀌지 않습니다");
    expect(host.querySelector('[data-testid="theme-screen-preview"]')).toBeNull();
    await act(async () => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
    expect(document.activeElement).toBe(trigger);
    expect(host.querySelector<HTMLInputElement>('[aria-label="테마 이름"]')?.value).toBe("활성 축제");
  });

  it("distinguishes active and selected themes and uses readable fixed admin actions", async () => {
    await render();
    expect(buttons("변경사항 없음")).toHaveLength(0);
    expect(buttons("적용 중")).toHaveLength(0);
    expect(host.querySelector('[aria-label="저장 상태"]')?.textContent).toBe("변경사항 없음");
    expect(host.querySelector('[aria-label="테마 적용 상태"]')?.textContent).toBe("적용 중");
    expect(host.querySelector('[aria-label="테마 적용 상태"] svg')).not.toBeNull();
    expect(buttons("복제")[0].className).toContain("border-[var(--admin-theme-action-outline)]");
    await act(async () => { buttons("저장된 테마")[0].click(); });
    const selected = host.querySelector('[aria-label="저장된 테마 목록"] [aria-pressed="true"]');
    expect(selected?.textContent).toContain("저장된 테마");
    expect(selected?.className).toContain("border-[var(--admin-theme-action-outline)]");
    expect(host.querySelector('[aria-label="저장된 테마 목록"]')?.textContent).toContain("활성");
    expect(buttons("저장된 테마 적용")[0].disabled).toBe(false);
    await setInput("테마 이름", "수정본");
    expect(buttons("저장")[0].className).toContain("bg-[var(--admin-theme-action-bg)]");
    expect(buttons("저장된 테마 적용")[0].disabled).toBe(true);
    expect(host.querySelector('[aria-label="테마 편집 작업"]')?.textContent).toContain("변경사항을 저장한 뒤 적용");
  });

  it("scrolls each theme submenu anchor below the sticky header", async () => {
    const original = Object.getOwnPropertyDescriptor(Element.prototype, "scrollIntoView");
    const scroll = vi.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: scroll });
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => { callback(0); return 1; });
    try {
      await render(true);
      await act(async () => { buttons("관리 영역 링크")[0].click(); });
      expect(scroll).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
      expect(host.querySelector("#theme-management")?.className).toContain("scroll-mt-40");
      await act(async () => { buttons("AI 영역 링크")[0].click(); });
      expect(scroll).toHaveBeenCalledTimes(2);
      expect(host.querySelector("#theme-ai")?.className).toContain("scroll-mt-40");
    } finally {
      if (original) Object.defineProperty(Element.prototype, "scrollIntoView", original);
      else Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    }
  });

  it("uses booth map category labels without changing ThemeData keys", () => {
    expect(THEME_FIELDS[2].colors).toEqual([
      ["pub", "주점"], ["foodTruck", "푸드트럭"], ["experience", "부스"],
      ["event", "이벤트"], ["restArea", "쉼터"], ["facility", "편의시설"],
    ]);
    expect(Object.keys(colors.category)).toEqual(["pub", "foodTruck", "experience", "event", "restArea", "facility"]);
  });

  it("renders safely before recommendation and shows a format error for a legacy single-theme response", async () => {
    await prepareRecommendation();
    expect(host.querySelector('[aria-label="AI 추천 시안"]')).toBeNull();
    // The API boundary rejects a bare ThemeData instead of putting undefined into candidate state.
    vi.mocked(adminThemeApi.recommend).mockRejectedValueOnce(new Error("AI_THEME_RESPONSE_INVALID"));
    await act(async () => { buttons("다시 추천받기")[0].click(); });
    expect(host.querySelector('[aria-label="AI 추천 시안"]')).toBeNull();
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("응답 형식");
    expect(host.querySelector('[data-testid="theme-preview"]')).not.toBeNull();
  });

  it("uses a newly typed valid HEX as the recommendation base color", async () => {
    await prepareRecommendation();
    await setInput("기준 색상 HEX", "#aabbcc");
    expect(host.querySelector('[aria-label="선택한 기준 색상"]')?.textContent).toContain("#AABBCC");
    expect(buttons("다시 추천받기")[0].disabled).toBe(false);
    await act(async () => { buttons("다시 추천받기")[0].click(); });
    expect(adminThemeApi.recommend).toHaveBeenCalledWith({
      sourceColors: ["#4EB15E", "#13730C"], selectedBaseColor: "#AABBCC",
    }, expect.any(AbortSignal));
  });

  it("invalidates selection and blocks automatic recommendation for an incomplete HEX", async () => {
    await prepareRecommendation();
    await setInput("기준 색상 HEX", "#bad");
    expect(host.querySelector('[aria-label="선택한 기준 색상"]')?.textContent).toContain("선택되지 않음");
    expect(buttons("다시 추천받기")[0].disabled).toBe(true);
    await act(async () => { buttons("다시 추천받기")[0].click(); });
    expect(adminThemeApi.recommend).not.toHaveBeenCalled();

    await act(async () => { host.querySelector<HTMLButtonElement>('button[aria-label="기준 색상 #13730C 선택"]')!.click(); });
    expect((host.querySelector('input[aria-label="기준 색상 HEX"]') as HTMLInputElement).value).toBe("#13730C");
    expect(buttons("다시 추천받기")[0].disabled).toBe(false);
    await act(async () => { buttons("다시 추천받기")[0].click(); });
    expect(adminThemeApi.recommend).toHaveBeenCalledWith({
      sourceColors: ["#4EB15E", "#13730C"], selectedBaseColor: "#13730C",
    }, expect.any(AbortSignal));
  });

  it("blocks duplicate AI requests and preserves the old draft on failure", async () => {
    await prepareRecommendation();
    expect(buttons("다시 추천받기")[0].className).toContain("bg-[var(--admin-theme-action-bg)]");
    const before = host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style");
    let reject!: (reason: unknown) => void;
    vi.mocked(adminThemeApi.recommend).mockReturnValue(new Promise((_, fail) => { reject = fail; }));
    await act(async () => { buttons("다시 추천받기")[0].click(); });
    expect(buttons("AI 추천 생성 중…")[0].disabled).toBe(true);
    expect(host.querySelector('[aria-label="AI 추천 작업 단계"] li:last-child')?.getAttribute("data-state")).toBe("generating");
    expect(buttons("AI 추천 생성 중…")[0].className).toContain("disabled:bg-[var(--ds-admin-action-disabled-bg)]");
    expect(buttons("AI 추천 생성 중…")[0].getAttribute("aria-busy")).toBe("true");
    await act(async () => { buttons("AI 추천 생성 중…")[0].click(); });
    expect(adminThemeApi.recommend).toHaveBeenCalledOnce();
    await act(async () => reject({ status: 429, payload: { code: "OPENAI_RATE_LIMIT" } }));
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("요청 한도");
    expect(host.querySelector('[aria-label="AI 추천 작업 단계"] li:last-child')?.getAttribute("data-state")).toBe("ready");
    expect(host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style")).toBe(before);
  });

  it("shows all 14 colors but only allows brand color editing", async () => {
    await render();
    expect(host.querySelector('[aria-label="현재 활성 테마"]')?.textContent).toContain("활성 축제");
    expect(host.querySelectorAll('input[type="color"]')).toHaveLength(14);
    expect(host.querySelectorAll('input[type="color"]:not(:disabled)')).toHaveLength(4);
    expect(host.querySelectorAll('input[aria-label$="HEX"]')).toHaveLength(14);
    expect(host.querySelector('input[aria-label="Strong · 진한 브랜드 컬러 HEX"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="theme-preview"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="theme-preview"]')?.textContent).toContain("강조 버튼");
    expect(host.querySelector('[aria-label="테마 생성 출처"]')?.textContent).toContain("생성 출처 정보가 없는 수동 테마");
  });

  it("preserves a legacy theme on load but normalizes its edited copy before saving", async () => {
    const legacy = { ...active, themeData: { ...colors,
      status: { ...colors.status, success: "#000000" },
      category: { ...colors.category, foodTruck: "#ffffff", pub: "#111111" },
    } };
    vi.mocked(adminThemeApi.list).mockResolvedValue([legacy]);
    vi.mocked(adminThemeApi.get).mockResolvedValue(legacy);
    await render();
    expect(host.querySelector<HTMLInputElement>('input[aria-label="Success HEX"]')?.value).toBe("#000000");
    expect(adminThemeApi.update).not.toHaveBeenCalled();
    await setInput("Primary HEX", "#3b82f6");
    expect(host.querySelector<HTMLInputElement>('input[aria-label="주점 HEX"]')?.value).toBe("#3b82f6");
    expect(host.querySelector<HTMLInputElement>('input[aria-label="Success HEX"]')?.value).toBe("#2e7d32");
    await act(async () => buttons("저장")[0].click());
    const payload = vi.mocked(adminThemeApi.create).mock.calls[0][0];
    expect(payload.themeData.status).toEqual(colors.status);
    expect(payload.themeData.category).toEqual({ ...colors.category, pub: "#3b82f6" });
    expect(legacy.themeData.status.success).toBe("#000000");
    expect(adminThemeApi.update).not.toHaveBeenCalled();
    expect(adminThemeApi.activate).not.toHaveBeenCalled();
  });

  it("shows saved provenance and copies it when duplicating a theme", async () => {
    const sourced = { ...active, sourcePosterUrl: "https://cdn.example.com/poster-a.png",
      selectedBaseColor: "#4EB15E", sourceColors: ["#4EB15E", "#13730C"] };
    vi.mocked(adminThemeApi.list).mockResolvedValue([sourced]);
    vi.mocked(adminThemeApi.get).mockResolvedValue(sourced);
    await render();
    expect(host.querySelector('[aria-label="테마 생성 출처"]')?.textContent).toContain("기준색 #4EB15E");
    await act(async () => { host.querySelector<HTMLElement>('[aria-label="테마 생성 출처"] summary')!.click(); });
    expect(host.querySelector<HTMLImageElement>('img[alt="테마 기반 포스터"]')?.src).toBe(sourced.sourcePosterUrl);
    expect(host.querySelector('[aria-label="테마 생성 출처"]')?.textContent).toContain("#13730C");
    await act(async () => { buttons("복제")[0].click(); });
    await act(async () => { buttons("저장")[0].click(); });
    expect(adminThemeApi.create).toHaveBeenCalledWith(expect.objectContaining({
      sourcePosterUrl: sourced.sourcePosterUrl,
      selectedBaseColor: sourced.selectedBaseColor,
      sourceColors: sourced.sourceColors,
    }));
  });

  it("snapshots each poster analysis into a newly created theme", async () => {
    const posterA = "https://cdn.example.com/festival/1/poster/a.png";
    const posterB = "https://cdn.example.com/festival/1/poster/b.png";
    vi.mocked(festivalBrandingApi.get).mockResolvedValue({ festivalSettingId: 1, posterImageUrl: posterA, logoImageUrl: null });
    vi.mocked(festivalBrandingApi.extractPosterColors)
      .mockResolvedValueOnce({ colors: [{ hex: "#4EB15E", population: 0.4 }] })
      .mockResolvedValueOnce({ colors: [{ hex: "#FBE44B", population: 0.5 }] });
    vi.mocked(festivalBrandingApi.upload).mockResolvedValue({ festivalSettingId: 1, posterImageUrl: posterB, logoImageUrl: null });
    await render();
    await act(async () => { buttons("대표색 추출")[0].click(); });
    await act(async () => { host.querySelector<HTMLButtonElement>('button[aria-label="기준 색상 #4EB15E 선택"]')!.click(); });
    await act(async () => { host.querySelector<HTMLButtonElement>('[aria-label="새 테마 생성"]')!.click(); });
    await setInput("테마 이름", "Theme A");
    await act(async () => { buttons("저장")[0].click(); });
    expect(vi.mocked(adminThemeApi.create).mock.calls[0][0]).toEqual(expect.objectContaining({
      sourcePosterUrl: posterA, selectedBaseColor: "#4EB15E", sourceColors: ["#4EB15E"],
    }));
    const fileInput = host.querySelector<HTMLInputElement>('input[aria-label="공식 포스터 파일 선택"]')!;
    Object.defineProperty(fileInput, "files", { configurable: true, value: [new File(["png"], "b.png", { type: "image/png" })] });
    await act(async () => { fileInput.dispatchEvent(new Event("change", { bubbles: true })); });
    await act(async () => { buttons("대표색 추출")[0].click(); });
    await act(async () => { host.querySelector<HTMLButtonElement>('button[aria-label="기준 색상 #FBE44B 선택"]')!.click(); });
    await act(async () => { host.querySelector<HTMLButtonElement>('[aria-label="새 테마 생성"]')!.click(); });
    await setInput("테마 이름", "Theme B");
    await act(async () => { buttons("저장")[0].click(); });
    expect(vi.mocked(adminThemeApi.create).mock.calls[1][0]).toEqual(expect.objectContaining({
      sourcePosterUrl: posterB, selectedBaseColor: "#FBE44B", sourceColors: ["#FBE44B"],
    }));
  });

  it("keeps draft preview scoped and saves an active edit as an inactive copy", async () => {
    await render();
    await setInput("Primary HEX", "#123456");
    expect(host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style")).toContain("--preview-brand-primary: #123456");
    expect(host.querySelector<HTMLInputElement>('input[aria-label="주점 HEX"]')?.value).toBe("#123456");
    expect(host.querySelector<HTMLInputElement>('input[aria-label="주점 HEX"]')?.disabled).toBe(true);
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
    await act(async () => { buttons("저장")[0].click(); });
    expect(adminThemeApi.create).toHaveBeenCalledOnce();
    expect(adminThemeApi.update).not.toHaveBeenCalled();
    expect(adminThemeApi.activate).not.toHaveBeenCalled();
    expect(vi.mocked(adminThemeApi.create).mock.calls[0][0].themeData.brand.primary).toBe("#123456");
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
  });

  it("uses PUT for inactive edits and activates only through the separate action", async () => {
    await render();
    const list = host.querySelector('[aria-label="저장된 테마 목록"]')!;
    expect(list.querySelector('[aria-pressed="true"]')?.textContent).toContain("활성 축제");
    expect(list.textContent).toContain("활성");
    await act(async () => { buttons("저장된 테마")[0].click(); });
    expect(list.querySelector('[aria-pressed="true"]')?.textContent).toContain("저장된 테마");
    expect(list.querySelector('[aria-pressed="true"]')?.className).toContain("ring-1");
    expect(host.querySelector<HTMLInputElement>('[aria-label="테마 이름"]')?.value).toBe("저장된 테마");
    await setInput("테마 이름", "수정한 테마");
    await act(async () => { buttons("저장")[0].click(); });
    expect(adminThemeApi.update).toHaveBeenCalledWith(2, expect.objectContaining({ name: "수정한 테마" }));
    expect(adminThemeApi.activate).not.toHaveBeenCalled();
    vi.mocked(adminThemeApi.activate).mockResolvedValue({ ...inactive, name: "수정한 테마", active: true, themeData: { ...colors, brand: { ...colors.brand, primary: "#123456" } } });
    await act(async () => { buttons("저장된 테마 적용")[0].click(); });
    expect(adminThemeApi.activate).toHaveBeenCalledWith(2);
    expect(host.querySelector('[aria-label="현재 활성 테마"]')?.textContent).toContain("수정한 테마");
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#123456");
  });

  it("creates an inactive theme from the active palette and includes all 14 colors", async () => {
    await render();
    await act(async () => { host.querySelector<HTMLButtonElement>('[aria-label="새 테마 생성"]')!.click(); });
    await setInput("테마 이름", "새 축제");
    await act(async () => { buttons("저장")[0].click(); });
    const payload = vi.mocked(adminThemeApi.create).mock.calls[0][0];
    expect(payload.themeData).toEqual(colors);
    expect(THEME_FIELDS.reduce((count, group) => count + group.colors.length, 0)).toBe(14);
    expect(adminThemeApi.activate).not.toHaveBeenCalled();
  });

  it("uses bundled root defaults when no active or saved theme exists", async () => {
    vi.mocked(adminThemeApi.list).mockResolvedValue([]);
    for (const group of THEME_FIELDS) {
      for (const [key] of group.colors) {
        document.documentElement.style.setProperty(
          THEME_CORE_VARIABLES[group.key][key as keyof typeof THEME_CORE_VARIABLES[typeof group.key]],
          (colors[group.key] as Record<string, string>)[key],
        );
      }
    }
    await render();
    expect(host.querySelector('[aria-label="Tangerine Cream 선택"]')?.getAttribute("aria-pressed")).toBe("true");
    expect(buttons("삭제")).toHaveLength(0);
    await act(async () => { host.querySelector<HTMLButtonElement>('[aria-label="새 테마 생성"]')!.click(); });
    await setInput("테마 이름", "첫 테마");
    await act(async () => { buttons("저장")[0].click(); });
    expect(vi.mocked(adminThemeApi.create).mock.calls[0][0].themeData).toEqual(colors);
  });

  it("copies a selected theme into a new draft without copying active state", async () => {
    await render();
    await act(async () => { buttons("복제")[0].click(); });
    expect((host.querySelector('input[aria-label="테마 이름"]') as HTMLInputElement).value).toBe("활성 축제 복제");
    await act(async () => { buttons("저장")[0].click(); });
    expect(adminThemeApi.create).toHaveBeenCalledWith(expect.objectContaining({ name: "활성 축제 복제", themeData: colors }));
    expect(adminThemeApi.activate).not.toHaveBeenCalled();
  });

  it("creates a copy if an inactive row became active before saving", async () => {
    await render();
    await act(async () => { buttons("저장된 테마")[0].click(); });
    await setInput("테마 이름", "변경된 이름");
    vi.mocked(adminThemeApi.get).mockResolvedValue({ ...inactive, active: true });
    await act(async () => { buttons("저장")[0].click(); });
    expect(adminThemeApi.create).toHaveBeenCalledOnce();
    expect(adminThemeApi.update).not.toHaveBeenCalled();
  });

  it("shows an understandable message for a stale active-delete 409", async () => {
    await render();
    await act(async () => { buttons("저장된 테마")[0].click(); });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(adminThemeApi.delete).mockRejectedValue({ status: 409 });
    await act(async () => { buttons("삭제")[0].click(); });
    expect(toastMock.error).toHaveBeenCalledWith(expect.stringContaining("활성 테마는 삭제할 수 없습니다"));
    expect(host.querySelector('[aria-label="현재 활성 테마"]')?.textContent).toContain("활성 축제");
  });

  it("deletes an inactive theme and returns to the active selection", async () => {
    await render();
    await act(async () => { buttons("저장된 테마")[0].click(); });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await act(async () => { buttons("삭제")[0].click(); });
    expect(adminThemeApi.delete).toHaveBeenCalledWith(2);
    expect(buttons("저장된 테마")).toHaveLength(0);
    expect((host.querySelector('input[aria-label="테마 이름"]') as HTMLInputElement).value).toBe("활성 축제");
  });

  it("reports a save error without changing the active theme", async () => {
    await render();
    await setInput("Primary HEX", "#123456");
    vi.mocked(adminThemeApi.create).mockRejectedValue(new Error("unavailable"));
    await act(async () => { buttons("저장")[0].click(); });
    expect(toastMock.error).toHaveBeenCalledWith(expect.stringContaining("저장에 실패"));
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
  });

  it("rejects missing or invalid colors before saving", () => {
    expect(validateThemeDraft({ name: "Test", themeData: { ...colors, category: { ...colors.category, facility: "" } } })).toContain("#RRGGBB");
    expect(validateThemeDraft({ name: "Test", themeData: { ...colors, brand: { ...colors.brand, primary: "red" } } })).toContain("#RRGGBB");
  });
});
