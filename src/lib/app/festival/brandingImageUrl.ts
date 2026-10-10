import { getApiBaseUrl } from "@/api/common/baseUrl";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/** Local uploads belong to the API server; S3/CDN URLs remain untouched. */
export function resolveBrandingImageUrl(rawUrl: string, apiBaseUrl = getApiBaseUrl(), browserHost = typeof window === "undefined" ? "" : window.location.hostname): string {
  try {
    const image = new URL(rawUrl, apiBaseUrl);
    if (!image.pathname.startsWith("/uploads/")) return rawUrl;
    if (!rawUrl.startsWith("/") && !(LOOPBACK_HOSTS.has(image.hostname) && !LOOPBACK_HOSTS.has(browserHost))) return rawUrl;
    const api = new URL(apiBaseUrl);
    image.protocol = api.protocol;
    image.host = api.host;
    return image.href;
  } catch {
    return rawUrl;
  }
}
