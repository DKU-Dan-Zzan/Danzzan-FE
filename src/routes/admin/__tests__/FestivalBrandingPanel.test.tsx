// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { festivalBrandingApi } from "@/api/app/festival/festivalBrandingApi";
import { FestivalBrandingPanel } from "@/routes/admin/FestivalBrandingPanel";
import { validateBrandingImage } from "@/routes/admin/festivalBrandingValidation";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));
vi.mock("@/api/app/festival/festivalBrandingApi", () => ({ festivalBrandingApi: { get: vi.fn(), upload: vi.fn(), extractPosterColors: vi.fn() } }));

let host: HTMLDivElement;
let root: Root;
const original = { festivalSettingId: 1, posterImageUrl: "https://cdn/old-poster.png", logoImageUrl: "https://cdn/old-logo.png" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.mocked(festivalBrandingApi.get).mockResolvedValue(original);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

async function render() {
  await act(async () => root.render(<FestivalBrandingPanel />));
}

async function choose(kind: "공식 포스터" | "축제 로고", file: File) {
  const input = host.querySelector<HTMLInputElement>(`input[aria-label="${kind} 파일 선택"]`)!;
  Object.defineProperty(input, "files", { configurable: true, value: [file] });
  await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
}

describe("FestivalBrandingPanel", () => {
  it("shows empty poster and logo states", async () => {
    vi.mocked(festivalBrandingApi.get).mockResolvedValue({ festivalSettingId: 1, posterImageUrl: null, logoImageUrl: null });
    await render();
    expect(host.textContent).toContain("등록된 공식 포스터가 없습니다.");
    expect(host.textContent).toContain("등록된 축제 로고가 없습니다.");
    expect([...host.querySelectorAll("button")].find((button) => button.textContent === "대표색 추출")?.disabled).toBe(true);
    expect([...host.querySelectorAll("button")].find((button) => button.textContent === "대표색 추출")?.className).toContain("disabled:bg-[#e7e5e4]");
  });

  it("updates only the successful upload preview", async () => {
    await render();
    vi.mocked(festivalBrandingApi.upload).mockResolvedValue({ ...original, posterImageUrl: "https://cdn/new-poster.png" });
    await choose("공식 포스터", new File(["png"], "poster.png", { type: "image/png" }));
    expect(host.querySelector<HTMLImageElement>('img[alt="현재 공식 포스터"]')?.src).toBe("https://cdn/new-poster.png");
    expect(host.querySelector<HTMLImageElement>('img[alt="현재 축제 로고"]')?.src).toBe(original.logoImageUrl);
    expect(festivalBrandingApi.upload).toHaveBeenCalledWith("poster", expect.any(File));
  });

  it("preserves preview when upload fails", async () => {
    await render();
    vi.mocked(festivalBrandingApi.upload).mockRejectedValue(new Error("storage unavailable"));
    await choose("축제 로고", new File(["png"], "logo.png", { type: "image/png" }));
    expect(host.querySelector<HTMLImageElement>('img[alt="현재 축제 로고"]')?.src).toBe(original.logoImageUrl);
    expect(toastMock.error).toHaveBeenCalled();
  });

  it("rejects oversized and unsupported files before upload", async () => {
    expect(validateBrandingImage(new File(["svg"], "logo.svg", { type: "image/svg+xml" }))).not.toBeNull();
    expect(validateBrandingImage(new File([""], "empty.png", { type: "image/png" }))).not.toBeNull();
    await render();
    await choose("공식 포스터", new File(["svg"], "logo.svg", { type: "image/svg+xml" }));
    expect(festivalBrandingApi.upload).not.toHaveBeenCalled();
  });

  it("accepts 5MB but blocks larger poster and logo uploads", async () => {
    const boundary = new File([new Uint8Array(5 * 1024 * 1024)], "boundary.png", { type: "image/png" });
    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" });
    expect(validateBrandingImage(boundary)).toBeNull();
    expect(validateBrandingImage(oversized)).toContain("5MB");
    await render();
    await choose("공식 포스터", oversized);
    await choose("축제 로고", oversized);
    expect(festivalBrandingApi.upload).not.toHaveBeenCalled();
    expect(host.querySelector<HTMLImageElement>('img[alt="현재 공식 포스터"]')?.src).toBe(original.posterImageUrl);
    expect(host.querySelector<HTMLImageElement>('img[alt="현재 축제 로고"]')?.src).toBe(original.logoImageUrl);
  });

  it("extracts candidates and keeps a selection local to the panel", async () => {
    const themeBefore = document.documentElement.style.getPropertyValue("--theme-brand-primary");
    vi.mocked(festivalBrandingApi.extractPosterColors).mockResolvedValue({ colors: [
      { hex: "#C83218", population: 0.42 },
      { hex: "#F2A52B", population: 0.21 },
      { hex: "#274A83", population: 0.16 },
      { hex: "#41A867", population: 0.11 },
    ] });
    await render();
    expect([...host.querySelectorAll("button")].find((button) => button.textContent === "대표색 추출")?.className).toContain("bg-[var(--admin-theme-action-bg)]");
    await act(async () => [...host.querySelectorAll("button")].find((button) => button.textContent === "대표색 추출")!.click());
    expect(festivalBrandingApi.extractPosterColors).toHaveBeenCalledWith(1);
    expect(host.querySelectorAll('button[aria-label^="기준 색상 #"]')).toHaveLength(4);
    expect(host.textContent).toContain("대표색을 클릭하거나 HEX를 입력하면 기준색으로 선택됩니다.");
    await act(async () => host.querySelector<HTMLButtonElement>('button[aria-label="기준 색상 #274A83 선택"]')!.click());
    expect(host.querySelector('[aria-label="선택한 기준 색상"]')?.textContent).toContain("#274A83");
    expect(host.querySelector('[aria-label="선택한 기준 색상"]')?.textContent).toContain("선택된 기준색");
    expect(host.querySelector('[aria-label="기준 색상 #274A83 선택"]')?.getAttribute("aria-pressed")).toBe("true");
    expect(host.querySelector('[aria-label="기준 색상 #274A83 선택"]')?.className).toContain("ring-2");
    expect(host.textContent).toContain("추출 완료");
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe(themeBefore);
  });

  it("shows analysis loading until extraction completes", async () => {
    let resolve!: (value: { colors: { hex: string; population: number }[] }) => void;
    vi.mocked(festivalBrandingApi.extractPosterColors).mockReturnValue(new Promise((done) => { resolve = done; }));
    await render();
    await act(async () => [...host.querySelectorAll("button")].find((button) => button.textContent === "대표색 추출")!.click());
    expect([...host.querySelectorAll("button")].find((button) => button.textContent === "분석 중…")?.disabled).toBe(true);
    await act(async () => resolve({ colors: [{ hex: "#CC4422", population: 0.4 }] }));
    expect(host.textContent).toContain("#CC4422");
  });

  it("discards an old extraction result after replacing the poster", async () => {
    let resolve!: (value: { colors: { hex: string; population: number }[] }) => void;
    vi.mocked(festivalBrandingApi.extractPosterColors).mockReturnValue(new Promise((done) => { resolve = done; }));
    vi.mocked(festivalBrandingApi.upload).mockResolvedValue({ ...original, posterImageUrl: "https://cdn/new-poster.png" });
    await render();
    await act(async () => [...host.querySelectorAll("button")].find((button) => button.textContent === "대표색 추출")!.click());
    await choose("공식 포스터", new File(["png"], "new-poster.png", { type: "image/png" }));
    await act(async () => resolve({ colors: [{ hex: "#CC4422", population: 0.4 }] }));
    expect(host.querySelectorAll('button[aria-label^="기준 색상 #"]')).toHaveLength(0);
    expect(host.querySelector('[aria-label="선택한 기준 색상"]')?.textContent).toContain("선택되지 않음");
  });

  it("reports extraction errors without changing existing images", async () => {
    vi.mocked(festivalBrandingApi.extractPosterColors).mockRejectedValue(new Error("storage unavailable"));
    await render();
    await act(async () => [...host.querySelectorAll("button")].find((button) => button.textContent === "대표색 추출")!.click());
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("분석하지 못했습니다");
    expect(host.querySelector<HTMLImageElement>('img[alt="현재 공식 포스터"]')?.src).toBe(original.posterImageUrl);
  });

  it("validates a manually entered base color", async () => {
    await render();
    const input = host.querySelector<HTMLInputElement>('input[aria-label="기준 색상 HEX"]')!;
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    await act(async () => { setValue.call(input, "#bad"); input.dispatchEvent(new Event("input", { bubbles: true })); });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect([...host.querySelectorAll("button")].some((button) => button.textContent === "기준색으로 선택")).toBe(false);
    await act(async () => { setValue.call(input, "#aabbcc"); input.dispatchEvent(new Event("input", { bubbles: true })); });
    expect(host.querySelector('[aria-label="선택한 기준 색상"]')?.textContent).toContain("#AABBCC");
    expect(host.querySelector('[aria-label="선택한 기준 색상"]')?.textContent).toContain("선택된 기준색");
    expect(input.getAttribute("aria-invalid")).toBe("false");
  });

  it("opens AI recommendation help on focus and click without starting a recommendation", async () => {
    await render();
    const help = host.querySelector<HTMLButtonElement>('button[aria-label="AI 테마 추천 안내"]')!;
    expect(help).not.toBeNull();
    await act(async () => { help.focus(); });
    expect(help.getAttribute("aria-expanded")).toBe("true");
    expect(document.body.textContent).toContain("색상 기준을 통과한 1~3개의 추천 시안");
    await act(async () => { help.blur(); });
    const hover = new MouseEvent("pointermove", { bubbles: true });
    Object.defineProperty(hover, "pointerType", { value: "mouse" });
    await act(async () => { help.dispatchEvent(hover); });
    expect(help.getAttribute("aria-expanded")).toBe("true");
    await act(async () => { help.click(); });
    expect(help.getAttribute("aria-expanded")).toBe("true");
    expect(document.body.textContent).toContain("선택한 기준색과 포스터 대표색");
  });
});
