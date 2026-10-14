// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CURRENT_FESTIVAL_SETTING_ID } from "@/config/festivalSetting";
import { adminHomeImageApi } from "@/api/app/admin/adminHomeImageApi";

const request = vi.hoisted(() => vi.fn());
vi.mock("@/api/common/fetchAuth", () => ({ createFetchWithAuth: () => request }));

beforeEach(() => request.mockReset().mockResolvedValue([]));

describe("adminHomeImageApi", () => {
  it("replaces only the first image with a concurrency fingerprint", async () => {
    const payload = { imageUrl: "azure:images/festival/home/staged/new.jpg", expectedFirstImageId: 7, expectedFirstImageUrl: "azure:images/old.jpg", sourcePosterUrl: null };
    await adminHomeImageApi.replaceFirst(payload);
    expect(request).toHaveBeenCalledWith(`/admin/festival/${CURRENT_FESTIVAL_SETTING_ID}/home-images/first`, { method: "PUT", body: JSON.stringify(payload) });
  });
  it("previews and stages without using the live home-image creation endpoint", async () => {
    const signal = new AbortController().signal;
    const payload = { sourcePosterUrl: "https://cdn/poster.png", layout: "cover" as const, focusX: .2, focusY: .7 };
    await adminHomeImageApi.preview(payload, 2, signal);
    expect(request).toHaveBeenLastCalledWith("/admin/festival/2/home-images/preview", { method: "POST", body: JSON.stringify(payload), signal });
    const file = new File(["image"], "banner.png", { type: "image/png" });
    await adminHomeImageApi.stageUpload(file, undefined, signal);
    expect(request).toHaveBeenLastCalledWith(`/admin/festival/${CURRENT_FESTIVAL_SETTING_ID}/home-images/staged`, { method: "POST", body: expect.any(FormData), signal });
    expect((request.mock.calls.at(-1)![1].body as FormData).get("file")).toBe(file);
  });
  it("uses festival-scoped authenticated endpoints and preserves upload FormData", async () => {
    const base = `/admin/festival/${CURRENT_FESTIVAL_SETTING_ID}/home-images`;
    const signal = new AbortController().signal;
    const file = new File(["image"], "wide.png", { type: "image/png" });
    await adminHomeImageApi.list(undefined, signal);
    await adminHomeImageApi.upload(file);
    await adminHomeImageApi.reorder([3, 1, 2]);
    await adminHomeImageApi.delete(3);

    expect(request.mock.calls[0]).toEqual([base, { signal }]);
    expect(request.mock.calls[1][0]).toBe(base);
    expect(request.mock.calls[1][1].method).toBe("POST");
    expect((request.mock.calls[1][1].body as FormData).get("file")).toBe(file);
    expect(request.mock.calls[2]).toEqual([`${base}/order`, { method: "PUT", body: JSON.stringify({ imageIds: [3, 1, 2] }) }]);
    expect(request.mock.calls[3]).toEqual([`${base}/3`, { method: "DELETE" }]);
  });

  it("can target another festival without changing the shared default setting", async () => {
    await adminHomeImageApi.list(2);
    expect(request).toHaveBeenCalledWith("/admin/festival/2/home-images", { signal: undefined });
  });
});
