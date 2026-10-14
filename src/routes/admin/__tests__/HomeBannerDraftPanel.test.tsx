// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminHomeImageApi } from "@/api/app/admin/adminHomeImageApi";
import { HomeBannerDraftPanel, type HomeBannerDraftSelection } from "@/routes/admin/HomeBannerDraftPanel";

vi.mock("@/api/app/admin/adminHomeImageApi", () => ({ adminHomeImageApi: { list: vi.fn(), preview: vi.fn(), stageUpload: vi.fn(), upload: vi.fn() } }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const existing = { id: 7, imageUrl: "https://cdn/first.jpg", displayOrder: 0 };
const preview = { mimeType: "image/jpeg", imageBase64: "/9j/2Q==", width: 900, height: 1600, sourcePosterUrl: "poster-a" };
const jpeg = () => new File([new Uint8Array([255, 216, 255, 217])], "custom.jpg", { type: "image/jpeg" });
let root: Root, host: HTMLDivElement;
const save = vi.fn();
let changes: HomeBannerDraftSelection[];
const change = (value: HomeBannerDraftSelection) => changes.push(value);
const current = () => changes.at(-1)!;
const button = (text: string) => [...host.querySelectorAll("button")].find(item => item.textContent === text)!;
const click = async (text: string) => { await act(async () => button(text).click()); };
const makePreview = async () => { await click("공식 포스터로 편집"); await click("편집 결과 미리보기"); };
const render = async (posterUrl: string | null = "poster-a", disabled = false) => { await act(async () => root.render(<HomeBannerDraftPanel posterUrl={posterUrl} disabled={disabled} onChange={change} onSave={save} />)); };
const deferred = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { resolve, promise }; };
async function selectFile(file: File) {
  const input = host.querySelector<HTMLInputElement>('input[type="file"]')!;
  Object.defineProperty(input, "files", { configurable: true, value: [file] });
  await act(async () => { input.dispatchEvent(new Event("change", { bubbles: true })); await new Promise(resolve => setTimeout(resolve, 20)); });
}
beforeEach(() => {
  vi.resetAllMocks(); changes = [];
  vi.mocked(adminHomeImageApi.list).mockResolvedValue([existing]);
  vi.mocked(adminHomeImageApi.preview).mockResolvedValue(preview);
  let urls = 0;
  vi.stubGlobal("URL", class extends URL {
    static createObjectURL = vi.fn(() => `blob:banner-${++urls}`);
    static revokeObjectURL = vi.fn();
  });
  vi.stubGlobal("Image", class {
    naturalWidth = 1600; naturalHeight = 700;
    onload: (() => void) | null = null; onerror: (() => void) | null = null;
    set src(_value: string) { queueMicrotask(() => this.onload?.()); }
  });
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });

describe("HomeBannerDraftPanel", () => {
  it("opens editing without generating or saving and places draft actions below the preview", async () => {
    await render();
    expect(button("이미지 선택 취소")).toBeUndefined();
    await click("공식 포스터로 편집");
    expect(adminHomeImageApi.preview).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(button("홈화면 이미지 저장").disabled).toBe(true);
    expect([...host.querySelectorAll("option")].map(item => item.textContent)).toEqual(["원본 비율 유지", "세로 화면에 맞춰 자르기"]);
    await click("편집 결과 미리보기");
    expect(button("홈화면 이미지 저장").disabled).toBe(false);
    const labels = [...host.querySelectorAll("button")].map(item => item.textContent);
    expect(labels.indexOf("홈화면 이미지 파일 선택")).toBeLessThan(labels.indexOf("홈화면 이미지 저장"));
    expect(labels.indexOf("홈화면 이미지 저장")).toBeLessThan(labels.indexOf("이미지 선택 취소"));
    expect(host.querySelector('[aria-label="홈화면 이미지 저장 작업"]')!.compareDocumentPosition(host.querySelector('img')!) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    await click("이미지 선택 취소");
    expect(current()).toMatchObject({ previewUrl: existing.imageUrl, file: null });
    expect(button("홈화면 이미지 저장")).toBeUndefined();
  });
  it("saves a validated custom draft only on explicit save and resets its fingerprint", async () => {
    const saved = { id: 7, imageUrl: "https://cdn/new.jpg", displayOrder: 0 };
    save.mockResolvedValue(saved);
    await render();
    expect(button("홈화면 이미지 저장")).toBeUndefined();
    const file = jpeg(); await selectFile(file);
    expect(save).not.toHaveBeenCalled();
    await click("홈화면 이미지 저장");
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ file, expectedFirstImageId: 7, expectedFirstImageUrl: existing.imageUrl, sourcePosterUrl: null }));
    expect(current()).toMatchObject({ file: null, previewUrl: saved.imageUrl, expectedFirstImageUrl: saved.imageUrl, ready: true });
    expect(button("홈화면 이미지 저장")).toBeUndefined();
    expect(host.textContent).toContain("홈 이미지가 저장되었습니다");
  });
  it("blocks duplicate saves and editing while saving, and keeps a failed draft for retry", async () => {
    let reject!: (reason: unknown) => void;
    save.mockReturnValueOnce(new Promise((_resolve, fail) => { reject = fail; }));
    await render(); const file = jpeg(); await selectFile(file);
    await click("홈화면 이미지 저장");
    expect(current().ready).toBe(false);
    expect(button("저장 중…").disabled).toBe(true);
    expect(button("홈화면 이미지 파일 선택").disabled).toBe(true);
    await click("저장 중…"); expect(save).toHaveBeenCalledTimes(1);
    await act(async () => reject(new Error("offline")));
    expect(current()).toMatchObject({ file, ready: true });
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    save.mockResolvedValue(existing); await click("홈화면 이미지 저장");
    expect(save).toHaveBeenCalledTimes(2);
  });
  it("requires refreshing a conflicting first image before retrying with a fresh fingerprint", async () => {
    save.mockRejectedValueOnce({ status: 409 });
    await render(); const file = jpeg(); await selectFile(file); await click("홈화면 이미지 저장");
    expect(button("홈화면 이미지 저장").disabled).toBe(true);
    vi.mocked(adminHomeImageApi.list).mockResolvedValue([{ ...existing, id: 10, imageUrl: "https://cdn/changed.jpg" }]);
    await click("최신 홈 이미지 확인");
    expect(current()).toMatchObject({ file, expectedFirstImageId: 10, ready: true });
    expect(button("홈화면 이미지 저장").disabled).toBe(false);
  });
  it("blocks until the list is known, then defaults to KEEP with the first ordered image fingerprint", async () => {
    const list = deferred<typeof existing[]>(); vi.mocked(adminHomeImageApi.list).mockReturnValue(list.promise);
    await render(); expect(current().ready).toBe(false);
    await act(async () => list.resolve([{ id: 9, imageUrl: "last", displayOrder: 2 }, existing]));
    expect(current()).toEqual({ previewUrl: existing.imageUrl, file: null, expectedFirstImageId: 7, expectedFirstImageUrl: existing.imageUrl, sourcePosterUrl: null, ready: true });
    const count = changes.length; await render(); expect(changes).toHaveLength(count);
    expect(host.querySelector("img")?.src).toBe(existing.imageUrl);
  });
  it("keeps an empty list unchanged until the user explicitly prepares a draft", async () => {
    vi.mocked(adminHomeImageApi.list).mockResolvedValue([]); await render();
    expect(current()).toMatchObject({ file: null, expectedFirstImageId: null, expectedFirstImageUrl: null, ready: true });
    expect(button("공식 포스터로 편집")).toBeDefined(); expect(button("홈화면 이미지 파일 선택")).toBeDefined();
    expect(adminHomeImageApi.preview).not.toHaveBeenCalled(); expect(adminHomeImageApi.upload).not.toHaveBeenCalled();
  });
  it("blocks on list failure and retries without losing the initial fingerprint", async () => {
    vi.mocked(adminHomeImageApi.list).mockRejectedValueOnce(new Error("offline")); await render();
    expect(current().ready).toBe(false); expect(host.querySelector('[role="alert"]')).not.toBeNull();
    await click("다시 불러오기"); expect(current().ready).toBe(true); expect(current().expectedFirstImageId).toBe(7);
  });
  it("prepares contain only on request and stages a file without publishing", async () => {
    await render(); await makePreview();
    expect(adminHomeImageApi.preview).toHaveBeenCalledWith({ sourcePosterUrl: "poster-a", layout: "contain" }, undefined, expect.any(AbortSignal));
    expect(current()).toMatchObject({ ready: true, expectedFirstImageId: 7, sourcePosterUrl: "poster-a" });
    expect(current().file).toBeInstanceOf(File);
    const bytes = await new Promise<ArrayBuffer>(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as ArrayBuffer); reader.readAsArrayBuffer(current().file!); });
    expect([...new Uint8Array(bytes)]).toEqual([255, 216, 255, 217]);
    expect(adminHomeImageApi.stageUpload).not.toHaveBeenCalled(); expect(adminHomeImageApi.upload).not.toHaveBeenCalled();
  });
  it("requires an explicit preview after layout/focus changes", async () => {
    await render(); await makePreview();
    const layout = host.querySelector<HTMLSelectElement>('select[aria-label="배너 배치"]')!;
    await act(async () => { layout.value = "cover"; layout.dispatchEvent(new Event("change", { bubbles: true })); });
    const x = host.querySelector<HTMLInputElement>('input[aria-label="가로 초점"]')!;
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(x, "0.2"); x.dispatchEvent(new Event("input", { bubbles: true })); });
    expect(adminHomeImageApi.preview).toHaveBeenCalledTimes(1); expect(current().ready).toBe(false);
    await click("편집 결과 미리보기");
    expect(adminHomeImageApi.preview).toHaveBeenLastCalledWith({ sourcePosterUrl: "poster-a", layout: "cover", focusX: .2, focusY: .5 }, undefined, expect.any(AbortSignal));
    expect(current().ready).toBe(true);
  });
  it("aborts on KEEP and ignores an already queued late result", async () => {
    const work = deferred<typeof preview>(); vi.mocked(adminHomeImageApi.preview).mockReturnValue(work.promise);
    await render(); await makePreview(); expect(current().ready).toBe(false);
    const signal = vi.mocked(adminHomeImageApi.preview).mock.calls[0][2]!;
    await click("이미지 선택 취소"); expect(signal.aborted).toBe(true);
    await act(async () => work.resolve(preview));
    expect(current()).toMatchObject({ previewUrl: existing.imageUrl, file: null, ready: true });
  });
  it("clears generated drafts and ignores old poster responses on poster change", async () => {
    await render(); await makePreview(); const url = current().previewUrl;
    const work = deferred<typeof preview>(); vi.mocked(adminHomeImageApi.preview).mockReturnValue(work.promise);
    await click("편집 결과 미리보기"); const signal = vi.mocked(adminHomeImageApi.preview).mock.calls.at(-1)![2]!;
    await render("poster-b"); expect(signal.aborted).toBe(true);
    await act(async () => work.resolve(preview));
    expect(current()).toMatchObject({ previewUrl: existing.imageUrl, file: null, sourcePosterUrl: null, ready: true });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(url);
  });
  it("preserves a custom draft when the official poster changes and revokes its URL on reset", async () => {
    await render(); const file = jpeg(); await selectFile(file);
    expect(current()).toMatchObject({ file, sourcePosterUrl: null, ready: true });
    const url = current().previewUrl; await render("poster-b"); expect(current().file).toBe(file);
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(url);
    await click("이미지 선택 취소"); expect(URL.revokeObjectURL).toHaveBeenCalledWith(url);
  });
  it.each([
    new File([], "empty.jpg", { type: "image/jpeg" }),
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" }),
    new File(["fake"], "fake.jpg", { type: "image/jpeg" }),
    new File(["gif"], "file.gif", { type: "image/gif" }),
  ])("rejects invalid custom file $name without replacing KEEP", async file => {
    await render(); await selectFile(file);
    expect(current()).toMatchObject({ file: null, previewUrl: existing.imageUrl, ready: true });
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
  });
  it("preserves the previous draft on preview error and retries", async () => {
    await render(); vi.mocked(adminHomeImageApi.preview).mockRejectedValueOnce(new Error("preview failed"));
    await makePreview(); expect(current()).toMatchObject({ file: null, previewUrl: existing.imageUrl });
    await click("편집 결과 미리보기"); expect(current().file).toBeInstanceOf(File);
  });
  it("rejects mismatched poster output", async () => {
    await render(); vi.mocked(adminHomeImageApi.preview).mockResolvedValue({ ...preview, sourcePosterUrl: "other" });
    await makePreview(); expect(current().file).toBeNull(); expect(host.querySelector('[role="alert"]')).not.toBeNull();
  });
  it("does not let an old generated response replace a newly chosen custom file", async () => {
    const work = deferred<typeof preview>(); vi.mocked(adminHomeImageApi.preview).mockReturnValue(work.promise);
    await render(); await makePreview();
    const signal = vi.mocked(adminHomeImageApi.preview).mock.calls[0][2]!;
    const file = jpeg(); await selectFile(file); expect(signal.aborted).toBe(true);
    await act(async () => work.resolve(preview));
    expect(current()).toMatchObject({ file, sourcePosterUrl: null, ready: true });
  });
  it("reports preview timeout and permits retry while retaining KEEP", async () => {
    await render(); vi.useFakeTimers();
    try {
      vi.mocked(adminHomeImageApi.preview).mockImplementationOnce((_payload, _id, signal) => new Promise((_resolve, reject) => signal!.addEventListener("abort", () => reject(new Error("aborted")))));
      await makePreview();
      await act(async () => vi.advanceTimersByTimeAsync(60_000));
      expect(current()).toMatchObject({ file: null, previewUrl: existing.imageUrl, ready: true });
      expect(host.textContent).toContain("시간이 초과");
      await click("편집 결과 미리보기"); expect(current().file).toBeInstanceOf(File);
    } finally { vi.useRealTimers(); }
  });
  it("releases validation URLs and ignores a decode completed after KEEP", async () => {
    const decoders: Array<{ onload: (() => void) | null }> = [];
    vi.stubGlobal("Image", class { naturalWidth = 10; naturalHeight = 10; onload = null; onerror = null; constructor() { decoders.push(this); } set src(_value: string) {} });
    await render(); await selectFile(jpeg()); expect(current().ready).toBe(false);
    const validationUrl = vi.mocked(URL.createObjectURL).mock.results.at(-1)!.value;
    await click("이미지 선택 취소"); expect(URL.revokeObjectURL).toHaveBeenCalledWith(validationUrl);
    expect(decoders[0].onload).toBeNull(); expect(current()).toMatchObject({ file: null, ready: true });
  });
  it.each(["unreadable", "oversized"] as const)("rejects %s decoded custom images", async mode => {
    vi.stubGlobal("Image", class {
      naturalWidth = 10000; naturalHeight = 10000;
      onload: (() => void) | null = null; onerror: (() => void) | null = null;
      set src(_value: string) { queueMicrotask(() => mode === "unreadable" ? this.onerror?.() : this.onload?.()); }
    });
    await render(); await selectFile(jpeg());
    expect(current()).toMatchObject({ file: null, ready: true }); expect(host.querySelector('[role="alert"]')).not.toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(vi.mocked(URL.createObjectURL).mock.results.at(-1)!.value);
  });
  it("releases the draft URL and aborts pending preview when unmounted", async () => {
    await render(); await makePreview(); const url = current().previewUrl;
    const work = deferred<typeof preview>(); vi.mocked(adminHomeImageApi.preview).mockReturnValue(work.promise);
    await click("편집 결과 미리보기"); const signal = vi.mocked(adminHomeImageApi.preview).mock.calls.at(-1)![2]!;
    await act(async () => root.unmount()); const count = changes.length;
    expect(signal.aborted).toBe(true); expect(URL.revokeObjectURL).toHaveBeenCalledWith(url);
    await act(async () => work.resolve(preview)); expect(changes).toHaveLength(count);
  });
  it("disables editing and prevents generation without a poster", async () => {
    await render(null); expect(button("공식 포스터로 편집").disabled).toBe(true);
    await render("poster-a", true); expect(button("홈화면 이미지 파일 선택").disabled).toBe(true);
    expect(host.querySelector<HTMLInputElement>('input[type="file"]')!.disabled).toBe(true);
  });
});

it("accepts rotated SAS preview provenance and preserves the draft across SAS refresh", async () => {
  const poster = "https://demo.blob.core.windows.net/images/poster.png?sig=old";
  const renewed = poster.replace("sig=old", "sig=new");
  vi.mocked(adminHomeImageApi.preview).mockResolvedValue({ ...preview, sourcePosterUrl: renewed });
  await render(poster);
  await makePreview();
  const file = current().file;
  expect(file).toBeInstanceOf(File);
  expect(host.querySelector('[role="alert"]')).toBeNull();
  await render(renewed);
  expect(current().file).toBe(file);
  expect(current().ready).toBe(true);
  await render(poster.replace("poster.png", "other.png"));
  expect(current().file).toBeNull();
});
