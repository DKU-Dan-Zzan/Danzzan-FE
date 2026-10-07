// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminTheme from "@/routes/admin/AdminTheme";
import type { ActiveThemeResponse, ThemeData } from "@/api/app/festival/activeThemeApi";
import { adminThemeApi } from "@/api/app/admin/adminThemeApi";
import type { ThemeRecommendationResponse } from "@/api/app/admin/adminThemeApi";
import { festivalBrandingApi } from "@/api/app/festival/festivalBrandingApi";
import { THEME_FIELDS, validateThemeDraft } from "@/routes/admin/themeEditor";
import { THEME_CORE_VARIABLES } from "@/lib/app/festival/activeTheme";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ Toaster: () => null, toast: toastMock }));
vi.mock("@/api/app/admin/adminThemeApi", () => ({ adminThemeApi: {
  list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), activate: vi.fn(), recommend: vi.fn(),
} }));
vi.mock("@/api/app/festival/festivalBrandingApi", () => ({ festivalBrandingApi: {
  get: vi.fn().mockResolvedValue({ festivalSettingId: 1, posterImageUrl: null, logoImageUrl: null }),
  upload: vi.fn(),
  extractPosterColors: vi.fn(),
} }));

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

async function render() {
  await act(async () => { root.render(<AdminTheme />); });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(festivalBrandingApi.get).mockResolvedValue({ festivalSettingId: 1, posterImageUrl: null, logoImageUrl: null });
  vi.mocked(festivalBrandingApi.extractPosterColors).mockReset();
  vi.mocked(festivalBrandingApi.upload).mockReset();
  vi.mocked(adminThemeApi.list).mockResolvedValue([active, inactive]);
  vi.mocked(adminThemeApi.get).mockImplementation(async (id) => id === 2 ? inactive : active);
  vi.mocked(adminThemeApi.create).mockImplementation(async (payload) => ({ ...inactive, id: 3, name: payload.name, themeData: payload.themeData }));
  vi.mocked(adminThemeApi.update).mockImplementation(async (id, payload) => ({ ...inactive, id, name: payload.name, themeData: payload.themeData }));
  vi.mocked(adminThemeApi.activate).mockResolvedValue({ ...inactive, active: true });
  vi.mocked(adminThemeApi.delete).mockResolvedValue(undefined);
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
  async function prepareRecommendation() {
    vi.mocked(festivalBrandingApi.get).mockResolvedValue({ festivalSettingId: 1,
      posterImageUrl: "https://cdn.example.com/poster.png", logoImageUrl: null });
    vi.mocked(festivalBrandingApi.extractPosterColors).mockResolvedValue({ colors: [
      { hex: "#4EB15E", population: 0.6 }, { hex: "#13730C", population: 0.2 },
    ] });
    await render();
    expect(buttons("AI 테마 추천")[0].disabled).toBe(true);
    await act(async () => { buttons("대표색 추출")[0].click(); });
    expect(buttons("AI 테마 추천")[0].disabled).toBe(true);
    await act(async () => { host.querySelector<HTMLButtonElement>('button[aria-label="기준 색상 #4EB15E 선택"]')!.click(); });
    expect(buttons("AI 테마 추천")[0].disabled).toBe(false);
  }

  it("shows three candidates without changing the draft, then applies only the chosen candidate and saves provenance", async () => {
    await prepareRecommendation();
    const before = host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style");
    await act(async () => { buttons("AI 테마 추천")[0].click(); });
    expect(adminThemeApi.recommend).toHaveBeenCalledWith({
      sourceColors: ["#4EB15E", "#13730C"], selectedBaseColor: "#4EB15E",
    });
    expect(host.querySelectorAll('[aria-label$="시안"]')).toHaveLength(4);
    expect(host.querySelector('[aria-label="Balanced 시안"]')?.textContent).toContain("원본형");
    expect(host.querySelector('[aria-label="Vibrant 시안"]')?.textContent).toContain("라이트형");
    expect(host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style")).toBe(before);
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
    expect(adminThemeApi.create).not.toHaveBeenCalled();
    expect(adminThemeApi.activate).not.toHaveBeenCalled();
    await act(async () => { buttons("이 시안 선택")[0].click(); });
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
    await act(async () => { buttons("AI 테마 추천")[0].click(); });
    await act(async () => { buttons("이 시안 선택")[1].click(); });
    expect(host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style")).toContain("--preview-brand-primary: #F69324");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await act(async () => { buttons("이 시안 선택")[2].click(); });
    expect(host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style")).toContain("--preview-brand-primary: #983508");
    const replacement: ThemeRecommendationResponse = { candidates: recommendation.candidates.map((candidate) => ({
      ...candidate, themeData: { ...candidate.themeData, brand: { ...candidate.themeData.brand, primary: "#123456" } },
    })) };
    vi.mocked(adminThemeApi.recommend).mockResolvedValue(replacement);
    await act(async () => { buttons("AI 테마 추천")[0].click(); });
    expect(host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style")).toContain("--preview-brand-primary: #983508");
    expect(host.querySelectorAll('[aria-label$="시안"]')).toHaveLength(4);
    expect(host.querySelector('[aria-label="Balanced 시안"]')?.getAttribute("style")).toContain("--preview-brand-primary: #123456");
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
  });

  it.each(["balanced", "vibrant", "deep"] as const)("renders two candidates when %s is filtered out", async (missing) => {
    vi.mocked(adminThemeApi.recommend).mockResolvedValue({
      candidates: recommendation.candidates.filter((candidate) => candidate.id !== missing),
    });
    await prepareRecommendation();
    const recommendButton = Array.from(host.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("AI 테마 추천"));
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

  it("retains previous candidates and the current draft if a later recommendation fails", async () => {
    await prepareRecommendation();
    await act(async () => { buttons("AI 테마 추천")[0].click(); });
    await act(async () => { buttons("이 시안 선택")[0].click(); });
    const before = host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style");
    vi.mocked(adminThemeApi.recommend).mockRejectedValue({ status: 502, payload: { code: "AI_THEME_DIVERSITY_FAILED" } });
    await act(async () => { buttons("AI 테마 추천")[0].click(); });
    expect(host.querySelectorAll('[aria-label$="시안"]')).toHaveLength(4);
    expect(host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style")).toBe(before);
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("색상 차이");
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe("#ff642d");
  });

  it("renders safely before recommendation and shows a format error for a legacy single-theme response", async () => {
    await prepareRecommendation();
    expect(host.querySelector('[aria-label="AI 추천 시안"]')).toBeNull();
    // The API boundary rejects a bare ThemeData instead of putting undefined into candidate state.
    vi.mocked(adminThemeApi.recommend).mockRejectedValueOnce(new Error("AI_THEME_RESPONSE_INVALID"));
    await act(async () => { buttons("AI 테마 추천")[0].click(); });
    expect(host.querySelector('[aria-label="AI 추천 시안"]')).toBeNull();
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("응답 형식");
    expect(host.querySelector('[data-testid="theme-preview"]')).not.toBeNull();
  });

  it("uses a newly typed valid HEX as the recommendation base color", async () => {
    await prepareRecommendation();
    await setInput("기준 색상 HEX", "#aabbcc");
    expect(host.querySelector('[aria-label="선택한 기준 색상"]')?.textContent).toContain("#AABBCC");
    expect(buttons("AI 테마 추천")[0].disabled).toBe(false);
    await act(async () => { buttons("AI 테마 추천")[0].click(); });
    expect(adminThemeApi.recommend).toHaveBeenCalledWith({
      sourceColors: ["#4EB15E", "#13730C"], selectedBaseColor: "#AABBCC",
    });
  });

  it("keeps the last valid selection while typing invalid HEX and prevents a stale request", async () => {
    await prepareRecommendation();
    await setInput("기준 색상 HEX", "#bad");
    expect(host.querySelector('[aria-label="선택한 기준 색상"]')?.textContent).toContain("#4EB15E");
    expect(buttons("AI 테마 추천")[0].disabled).toBe(true);
    expect(adminThemeApi.recommend).not.toHaveBeenCalled();

    await act(async () => { host.querySelector<HTMLButtonElement>('button[aria-label="기준 색상 #13730C 선택"]')!.click(); });
    expect((host.querySelector('input[aria-label="기준 색상 HEX"]') as HTMLInputElement).value).toBe("#13730C");
    expect(buttons("AI 테마 추천")[0].disabled).toBe(false);
    await act(async () => { buttons("AI 테마 추천")[0].click(); });
    expect(adminThemeApi.recommend).toHaveBeenCalledWith({
      sourceColors: ["#4EB15E", "#13730C"], selectedBaseColor: "#13730C",
    });
  });

  it("blocks duplicate AI requests and preserves the old draft on failure", async () => {
    await prepareRecommendation();
    const before = host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style");
    let reject!: (reason: unknown) => void;
    vi.mocked(adminThemeApi.recommend).mockReturnValue(new Promise((_, fail) => { reject = fail; }));
    await act(async () => { buttons("AI 테마 추천")[0].click(); });
    expect(buttons("AI 추천 생성 중…")[0].disabled).toBe(true);
    await act(async () => { buttons("AI 추천 생성 중…")[0].click(); });
    expect(adminThemeApi.recommend).toHaveBeenCalledOnce();
    await act(async () => reject({ status: 429, payload: { code: "OPENAI_RATE_LIMIT" } }));
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("요청 한도");
    expect(host.querySelector('[data-testid="theme-preview"]')?.getAttribute("style")).toBe(before);
  });

  it("shows the active theme and all 14 editable colors", async () => {
    await render();
    expect(host.querySelector('[aria-label="현재 활성 테마"]')?.textContent).toContain("활성 축제");
    expect(host.querySelectorAll('input[type="color"]')).toHaveLength(14);
    expect(host.querySelectorAll('input[aria-label$="HEX"]')).toHaveLength(14);
    expect(host.querySelector('input[aria-label="Strong · 진한 브랜드 컬러 HEX"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="theme-preview"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="theme-preview"]')?.textContent).toContain("강한 CTA");
    expect(host.querySelector('[aria-label="테마 생성 출처"]')?.textContent).toContain("기반 포스터 정보 없음");
  });

  it("shows saved provenance and copies it when duplicating a theme", async () => {
    const sourced = { ...active, sourcePosterUrl: "https://cdn.example.com/poster-a.png",
      selectedBaseColor: "#4EB15E", sourceColors: ["#4EB15E", "#13730C"] };
    vi.mocked(adminThemeApi.list).mockResolvedValue([sourced]);
    vi.mocked(adminThemeApi.get).mockResolvedValue(sourced);
    await render();
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
    await act(async () => { buttons("저장된 테마")[0].click(); });
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
    expect(host.textContent).toContain("저장된 테마가 없습니다");
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
