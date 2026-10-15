import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from "react";
import { isAzureBlobReadUrl, isAzureReadUrlExpiringSoon, renewAzureReadUrl } from "@/lib/app/azure/azureReadUrl";

type ImageErrorEvent = SyntheticEvent<Element>;
const RENEW_BEFORE_MS = 90_000;
const MIN_RENEW_DELAY_MS = 30_000;

const blobKey = (value: string): string => {
  try {
    const url = new URL(value);
    return `${url.host}${url.pathname}`;
  } catch {
    return value;
  }
};

const renewalDelay = (value: string): number | null => {
  if (!isAzureBlobReadUrl(value)) return null;
  const expiry = new URL(value).searchParams.get("se");
  const expiresAt = expiry ? Date.parse(expiry) : Number.NaN;
  return Number.isFinite(expiresAt) ? Math.max(MIN_RENEW_DELAY_MS, expiresAt - Date.now() - RENEW_BEFORE_MS) : null;
};

const expiryTime = (value: string): number => {
  try {
    return Date.parse(new URL(value).searchParams.get("se") ?? "");
  } catch {
    return Number.NaN;
  }
};

export function useAzureImageUrl(src: string | undefined, onRefreshFailure?: (event: ImageErrorEvent) => void) {
  const rawUrl = src ?? "";
  const [resolved, setResolved] = useState({ source: rawUrl, url: rawUrl });
  const sourceEpoch = useRef(0);
  const activeSource = useRef(rawUrl);
  const mounted = useRef(true);
  const refreshFailure = useRef(onRefreshFailure);
  const failedBlobKeys = useRef(new Set<string>());
  const lastProactiveUrl = useRef<string | null>(null);
  const displayUrl = resolved.source === rawUrl ? resolved.url : rawUrl;

  useEffect(() => {
    refreshFailure.current = onRefreshFailure;
  }, [onRefreshFailure]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (activeSource.current === rawUrl) return;
    activeSource.current = rawUrl;
    sourceEpoch.current += 1;
    failedBlobKeys.current.clear();
    lastProactiveUrl.current = null;
  }, [rawUrl]);

  const renew = useCallback((url: string, reason: "proactive" | "error", event?: ImageErrorEvent) => {
    if (!isAzureBlobReadUrl(url)) {
      if (event) refreshFailure.current?.(event);
      return;
    }
    const key = blobKey(url);
    if ((reason === "error" && failedBlobKeys.current.has(key)) || (reason === "proactive" && lastProactiveUrl.current === url)) {
      if (event) refreshFailure.current?.(event);
      return;
    }
    if (reason === "error") failedBlobKeys.current.add(key);
    else lastProactiveUrl.current = url;
    const epoch = sourceEpoch.current;
    void renewAzureReadUrl(url)
      .then((nextUrl) => {
        if (!mounted.current || epoch !== sourceEpoch.current) return;
        if (reason === "proactive" && (!Number.isFinite(expiryTime(nextUrl)) || expiryTime(nextUrl) <= expiryTime(url))) return;
        setResolved({ source: rawUrl, url: nextUrl });
      })
      .catch(() => {
        if (mounted.current && epoch === sourceEpoch.current && event) refreshFailure.current?.(event);
      });
  }, [rawUrl]);

  useEffect(() => {
    const delay = renewalDelay(displayUrl);
    if (delay === null || failedBlobKeys.current.has(blobKey(displayUrl)) || lastProactiveUrl.current === displayUrl) return;
    const timer = window.setTimeout(() => renew(displayUrl, "proactive"), Math.min(delay, 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [displayUrl, renew]);

  useEffect(() => {
    const renewWhenVisible = () => {
      if (document.visibilityState === "visible" && !failedBlobKeys.current.has(blobKey(displayUrl)) && isAzureReadUrlExpiringSoon(displayUrl)) renew(displayUrl, "proactive");
    };
    document.addEventListener("visibilitychange", renewWhenVisible);
    return () => document.removeEventListener("visibilitychange", renewWhenVisible);
  }, [displayUrl, renew]);

  const onError = useCallback((event: ImageErrorEvent) => {
    const target = event.currentTarget as Element & { currentSrc?: string };
    const url = target.currentSrc || displayUrl;
    const fallbackEvent = { ...event, currentTarget: target, target } as ImageErrorEvent;
    renew(url, "error", fallbackEvent);
  }, [displayUrl, renew]);

  const onLoad = useCallback(() => {
    failedBlobKeys.current.delete(blobKey(displayUrl));
  }, [displayUrl]);

  return { src: displayUrl, onError, onLoad };
}
