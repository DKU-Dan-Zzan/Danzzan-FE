// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { festivalBrandingApi } from "@/api/app/festival/festivalBrandingApi";
import { FestivalBrandingPanel, validateBrandingImage } from "@/routes/admin/FestivalBrandingPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));
vi.mock("@/api/app/festival/festivalBrandingApi", () => ({ festivalBrandingApi: { get: vi.fn(), upload: vi.fn() } }));

let host: HTMLDivElement;
let root: Root;
const original = { festivalSettingId: 1, posterImageUrl: "https://cdn/old-poster.png", logoImageUrl: "https://cdn/old-logo.png" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(festivalBrandingApi.get).mockResolvedValue(original);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
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
});
