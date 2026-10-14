import { describe, it, expect, vi } from "vitest";
import { createPosterBundleCache } from "@/routes/admin/posterBundle";

const result = (target: "ticket" | "closed") => ({ target, mimeType: "image/jpeg" as const, imageBase64: "/9j/2Q==", width: 800, height: 360, focusX: .5, focusY: .5, reason: "여백", sourcePosterUrl: "poster-a" });
describe("poster recommendation reuse", () => {
  it("shares in-flight work and reuses both crops when only the theme color changes", async () => {
    const fetch = vi.fn(async (target: "ticket" | "closed") => result(target));
    const cache = createPosterBundleCache(fetch);
    const a = cache.get("poster-a"), b = cache.get("poster-a");
    expect(a).toBe(b);
    expect((await a).ticket.target).toBe("ticket");
    await cache.get("poster-a");
    expect(fetch).toHaveBeenCalledTimes(2);
    await expect(cache.get("poster-b")).rejects.toThrow();
  });
  it("retries only failed crops and never caches a mismatched poster", async () => {
    let fail = true;
    const fetch = vi.fn(async (target: "ticket" | "closed") => {
      if (target === "closed" && fail) throw new Error("temporary");
      return result(target);
    });
    const cache = createPosterBundleCache(fetch);
    await expect(cache.get("poster-a")).rejects.toThrow("temporary");
    fail = false;
    await cache.get("poster-a");
    expect(fetch.mock.calls.filter(([target]) => target === "ticket")).toHaveLength(1);
    expect(fetch.mock.calls.filter(([target]) => target === "closed")).toHaveLength(2);
  });
  it("aborts requests when the workflow is disposed", async () => {
    const signals: AbortSignal[] = [];
    const cache = createPosterBundleCache((_target, signal) => { signals.push(signal!); return new Promise(() => {}); });
    void cache.get("poster-a");
    cache.dispose();
    expect(signals).toHaveLength(2);
    expect(signals.every(signal => signal.aborted)).toBe(true);
  });
});
