// @vitest-environment jsdom
import { act, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AzureImage } from "@/components/common/AzureImage";
import { useAzureImageUrl } from "@/hooks/app/useAzureImageUrl";

let host: HTMLDivElement;
let root: Root;

const azureUrl = (name: string, expiresAt: string, signature = name) =>
  `https://danzzandemo2026.blob.core.windows.net/images/${name}.png?sig=${signature}&se=${encodeURIComponent(expiresAt)}`;

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

function HookImage({ src, onRefreshFailure }: { src: string; onRefreshFailure?: () => void }) {
  const image = useAzureImageUrl(src, onRefreshFailure);
  return <img src={image.src} onError={image.onError} onLoad={image.onLoad} alt="hook" />;
}

function ReRenderingAzureImage({ src }: { src: string }) {
  const [, setRenderCount] = useState(0);
  useEffect(() => {
    const interval = window.setInterval(() => setRenderCount((count) => count + 1), 5_000);
    return () => window.clearInterval(interval);
  }, []);
  return <AzureImage src={src} alt="rerendering" />;
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("AzureImage", () => {
  it("renews successive five-minute SAS URLs before each expiry", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-12T00:00:00Z"));
    const expiring = azureUrl("a", "2026-10-12T00:05:00Z", "old");
    const firstRenewal = azureUrl("a", "2026-10-12T00:10:00Z", "first");
    const secondRenewal = azureUrl("a", "2026-10-12T00:15:00Z", "second");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ imageUrl: firstRenewal }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ imageUrl: secondRenewal }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await act(async () => root.render(<AzureImage src={expiring} alt="Azure" />));
    await act(async () => vi.advanceTimersByTimeAsync(3.5 * 60_000));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(host.querySelector("img")?.getAttribute("src")).toBe(firstRenewal);

    await act(async () => vi.advanceTimersByTimeAsync(5 * 60_000));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(host.querySelector("img")?.getAttribute("src")).toBe(secondRenewal);
  });

  it("does not postpone a proactive renewal when its parent rerenders every five seconds", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-12T00:00:00Z"));
    const expiring = azureUrl("a", "2026-10-12T00:05:00Z", "old");
    const renewed = azureUrl("a", "2026-10-12T00:10:00Z", "renewed");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ imageUrl: renewed }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await act(async () => root.render(<ReRenderingAzureImage src={expiring} />));
    await act(async () => vi.advanceTimersByTimeAsync(4 * 60_000));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(host.querySelector("img")?.getAttribute("src")).toBe(renewed);
  });

  it("caps repeated Azure 404 load failures to one renewal until a successful image load", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    const fallback = vi.fn();
    const sas = azureUrl("a", "2099-01-01T00:00:00Z");

    await act(async () => root.render(<AzureImage src={sas} alt="Azure" onError={fallback} />));
    const image = host.querySelector("img")!;
    await act(async () => image.dispatchEvent(new Event("error")));
    await act(async () => image.dispatchEvent(new Event("error")));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fallback).toHaveBeenCalledTimes(2);

    await act(async () => image.dispatchEvent(new Event("load")));
    await act(async () => image.dispatchEvent(new Event("error")));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("leaves non-Azure error handling untouched", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const fallback = vi.fn();

    await act(async () => root.render(<AzureImage src="/assets/local.png" alt="Local" onError={fallback} />));
    const localImage = host.querySelector("img")!;
    await act(async () => localImage.dispatchEvent(new Event("error")));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it("ignores an older source's successful renewal after the source changes", async () => {
    const pending = deferred<Response>();
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pending.promise));
    const sourceA = azureUrl("a", "2099-01-01T00:00:00Z", "a");
    const sourceB = azureUrl("b", "2099-01-01T00:00:00Z", "b");
    const staleRenewal = azureUrl("a", "2099-01-01T01:00:00Z", "renewed-a");

    await act(async () => root.render(<HookImage src={sourceA} />));
    await act(async () => host.querySelector("img")!.dispatchEvent(new Event("error")));
    await act(async () => root.render(<HookImage src={sourceB} />));
    await act(async () => pending.resolve(new Response(JSON.stringify({ imageUrl: staleRenewal }), { status: 200 })));

    expect(host.querySelector("img")?.getAttribute("src")).toBe(sourceB);
  });

  it("ignores stale renewal rejections after a source change or unmount", async () => {
    const first = deferred<Response>();
    const second = deferred<Response>();
    const fetchMock = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    vi.stubGlobal("fetch", fetchMock);
    const fallback = vi.fn();
    const sourceA = azureUrl("a", "2099-01-01T00:00:00Z", "a");
    const sourceB = azureUrl("b", "2099-01-01T00:00:00Z", "b");

    await act(async () => root.render(<HookImage src={sourceA} onRefreshFailure={fallback} />));
    await act(async () => host.querySelector("img")!.dispatchEvent(new Event("error")));
    await act(async () => root.render(<HookImage src={sourceB} onRefreshFailure={fallback} />));
    await act(async () => first.reject(new Error("stale")));

    expect(fallback).not.toHaveBeenCalled();

    await act(async () => host.querySelector("img")!.dispatchEvent(new Event("error")));
    await act(async () => root.unmount());
    await act(async () => second.reject(new Error("unmounted")));

    expect(fallback).not.toHaveBeenCalled();
  });
});
