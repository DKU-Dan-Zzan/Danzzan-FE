// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHomeImageApi } from "@/api/app/admin/adminHomeImageApi";
import { HomeWideImagesPanel } from "@/routes/admin/HomeWideImagesPanel";
import { validateHomeWideImage } from "@/routes/admin/homeWideImageValidation";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));
vi.mock("@/api/app/admin/adminHomeImageApi", () => ({ adminHomeImageApi: { list: vi.fn(), upload: vi.fn(), delete: vi.fn(), reorder: vi.fn() } }));
vi.mock("@/routes/admin/homeWideImageValidation", () => ({ validateHomeWideImage: vi.fn() }));

const sample = [
  { id: 1, imageUrl: "https://cdn/one.png", displayOrder: 0 },
  { id: 2, imageUrl: "https://cdn/two.png", displayOrder: 1 },
  { id: 3, imageUrl: "https://cdn/three.png", displayOrder: 2 },
  { id: 4, imageUrl: "https://cdn/four.png", displayOrder: 3 },
];
let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.mocked(adminHomeImageApi.list).mockResolvedValue(sample);
  vi.mocked(validateHomeWideImage).mockImplementation(async (file) => file.size > 5 * 1024 * 1024 ? "이미지 크기는 최대 5MB까지 업로드할 수 있습니다." : null);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

async function render() { await act(async () => root.render(<HomeWideImagesPanel />)); }
async function click(button: HTMLButtonElement | undefined) { expect(button).toBeDefined(); await act(async () => button!.click()); }
function button(label: string) { return [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.getAttribute("aria-label") === label || item.textContent === label); }

describe("HomeWideImagesPanel", () => {
  it("shows a compact three-image summary and an empty state", async () => {
    await render();
    expect(host.querySelectorAll('img[alt$="와이드 이미지 미리보기"]')).toHaveLength(3);
    expect(host.querySelectorAll('button[aria-label$="이미지 확대 보기"]')).toHaveLength(3);
    expect(host.querySelector('button[aria-label="1번 이미지 확대 보기"]')?.className).toContain("aspect-[16/7]");
    expect(host.textContent).toContain("총 4개 등록됨");
    await act(async () => root.unmount());
    root = createRoot(host);
    vi.mocked(adminHomeImageApi.list).mockResolvedValue([]);
    await render();
    expect(host.textContent).toContain("등록된 와이드 이미지가 없습니다.");
  });

  it("uploads a valid image, refreshes the list, and does not touch theme variables", async () => {
    await render();
    const before = document.documentElement.style.getPropertyValue("--theme-brand-primary");
    await click(button("와이드 이미지 관리"));
    vi.mocked(adminHomeImageApi.upload).mockResolvedValue({ id: 5, imageUrl: "https://cdn/five.png", displayOrder: 4 });
    vi.mocked(adminHomeImageApi.list).mockResolvedValue([...sample, { id: 5, imageUrl: "https://cdn/five.png", displayOrder: 4 }]);
    const input = document.querySelector<HTMLInputElement>('input[aria-label="홈 화면 와이드 이미지 파일 선택"]')!;
    Object.defineProperty(input, "files", { configurable: true, value: [new File(["png"], "wide.png", { type: "image/png" })] });
    await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
    expect(adminHomeImageApi.upload).toHaveBeenCalledOnce();
    expect(host.textContent).toContain("총 5개 등록됨");
    expect(document.documentElement.style.getPropertyValue("--theme-brand-primary")).toBe(before);
  }, 15000);

  it("shows an uncropped original preview and a fallback for broken thumbnails", async () => {
    await render();
    await click(button("1번 이미지 확대 보기"));
    const preview = document.querySelector<HTMLImageElement>('img[alt="홈 화면 이미지 원본 미리보기"]');
    expect(preview?.src).toBe(sample[0].imageUrl);
    expect(preview?.className).toContain("object-contain");
    await click(button("닫기"));
    const thumbnail = host.querySelector<HTMLImageElement>('img[alt="1번 와이드 이미지 미리보기"]')!;
    await act(async () => thumbnail.dispatchEvent(new Event("error")));
    expect(host.textContent).toContain("이미지를 불러올 수 없습니다.");
  });

  it("persists up/down order and leaves the list unchanged on failure", async () => {
    await render();
    await click(button("와이드 이미지 관리"));
    vi.mocked(adminHomeImageApi.reorder).mockResolvedValue([sample[1], sample[0], sample[2], sample[3]]);
    await click(button("1번 이미지 아래로 이동"));
    expect(adminHomeImageApi.reorder).toHaveBeenCalledWith([2, 1, 3, 4]);
    vi.mocked(adminHomeImageApi.reorder).mockRejectedValue(new Error("network"));
    await click(button("1번 이미지 아래로 이동"));
    expect(toastMock.error).toHaveBeenCalled();
  });

  it("requires confirmation and retains the list if deletion fails", async () => {
    await render();
    await click(button("와이드 이미지 관리"));
    vi.stubGlobal("confirm", vi.fn(() => false));
    await click(button("1번 이미지 삭제"));
    expect(adminHomeImageApi.delete).not.toHaveBeenCalled();
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.mocked(adminHomeImageApi.delete).mockRejectedValue(new Error("network"));
    await click(button("1번 이미지 삭제"));
    expect(host.textContent).toContain("총 4개 등록됨");
  });

  it("removes a confirmed image from the summary after the server deletes it", async () => {
    await render();
    await click(button("와이드 이미지 관리"));
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.mocked(adminHomeImageApi.delete).mockResolvedValue(undefined);
    await click(button("1번 이미지 삭제"));
    expect(adminHomeImageApi.delete).toHaveBeenCalledWith(1);
    expect(host.textContent).toContain("총 3개 등록됨");
    expect(host.querySelector<HTMLImageElement>('img[alt="1번 와이드 이미지 미리보기"]')?.src).toBe("https://cdn/two.png");
  });

  it("rejects an oversized upload without changing the existing summary", async () => {
    await render();
    await click(button("와이드 이미지 관리"));
    const input = document.querySelector<HTMLInputElement>('input[aria-label="홈 화면 와이드 이미지 파일 선택"]')!;
    Object.defineProperty(input, "files", { configurable: true, value: [new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" })] });
    await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
    expect(adminHomeImageApi.upload).not.toHaveBeenCalled();
    expect(host.textContent).toContain("총 4개 등록됨");
    expect(toastMock.error).toHaveBeenCalled();
  });

  it("blocks excessive resolution and decoding errors before the API request", async () => {
    await render();
    await click(button("와이드 이미지 관리"));
    const input = document.querySelector<HTMLInputElement>('input[aria-label="홈 화면 와이드 이미지 파일 선택"]')!;
    const file = new File(["image"], "wide.jpg", { type: "image/jpeg" });
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    vi.mocked(validateHomeWideImage).mockResolvedValueOnce("이미지 해상도가 너무 높습니다. 크기를 줄여 다시 업로드해 주세요. (최대 4,000만 픽셀)");
    await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
    vi.mocked(validateHomeWideImage).mockResolvedValueOnce("이미지를 읽을 수 없습니다. 다른 이미지 파일을 선택해 주세요.");
    await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
    expect(adminHomeImageApi.upload).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalledTimes(2);
  });

  it("allows selecting the same file again after a server failure", async () => {
    await render();
    await click(button("와이드 이미지 관리"));
    const input = document.querySelector<HTMLInputElement>('input[aria-label="홈 화면 와이드 이미지 파일 선택"]')!;
    const file = new File(["image"], "wide.jpg", { type: "image/jpeg" });
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    vi.mocked(adminHomeImageApi.upload).mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ id: 5, imageUrl: "https://cdn/five.jpg", displayOrder: 4 });
    await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
    expect(input.value).toBe("");
    await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
    expect(adminHomeImageApi.upload).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain("총 5개 등록됨");
    expect(toastMock.error).toHaveBeenCalledWith("이미지를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  });
});
