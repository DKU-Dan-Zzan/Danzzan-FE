import { getApiBaseUrl } from "@/api/common/baseUrl";
import { createFetchWithAuth } from "@/api/common/fetchAuth";
import {
  clearAdminSession,
  getAdminAccessToken,
  reissueAdminToken,
} from "@/lib/app/admin/admin-auth-session";
import { authStore } from "@/store/common/authStore";

const RENEW_BEFORE_MS = 90_000;
const inFlight = new Map<string, Promise<string>>();

type ReadUrlResponse = { imageUrl?: unknown; data?: { imageUrl?: unknown } };

const fetchWithAdminAuth = createFetchWithAuth({
  getSessionEpoch: authStore.getSessionEpoch,
  getBaseUrl: getApiBaseUrl,
  getAccessToken: getAdminAccessToken,
  reissueAccessToken: reissueAdminToken,
  refreshKey: "admin-auth",
  sessionExpiredMessage: "세션이 만료되었습니다. 다시 로그인해 주세요.",
  clearSession: clearAdminSession,
});

export const isAzureBlobReadUrl = (value: string | null | undefined): value is string => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".blob.core.windows.net") && url.searchParams.has("sig");
  } catch {
    return false;
  }
};

/** SAS rotation changes access credentials, not the identity of the image. */
export const imageReferenceKey = (value: string | null | undefined): string | null | undefined => {
  if (!isAzureBlobReadUrl(value)) return value;
  const url = new URL(value);
  return JSON.stringify([url.origin, url.pathname, url.searchParams.get("versionid"), url.searchParams.get("snapshot")]);
};

export const sameImageReference = (left: string | null | undefined, right: string | null | undefined): boolean =>
  imageReferenceKey(left) === imageReferenceKey(right);

export const isAzureReadUrlExpiringSoon = (value: string, now = Date.now()): boolean => {
  if (!isAzureBlobReadUrl(value)) return false;
  const expiry = new URL(value).searchParams.get("se");
  if (!expiry) return false;
  const expiresAt = Date.parse(expiry);
  return Number.isFinite(expiresAt) && expiresAt - now <= RENEW_BEFORE_MS;
};

const readImageUrl = (payload: ReadUrlResponse): string | null => {
  const imageUrl = typeof payload.imageUrl === "string" ? payload.imageUrl : payload.data?.imageUrl;
  return typeof imageUrl === "string" && imageUrl.trim() ? imageUrl : null;
};

const requestReadUrl = async (imageUrl: string): Promise<ReadUrlResponse> => {
  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  };

  if (getAdminAccessToken()) {
    return fetchWithAdminAuth<ReadUrlResponse>("/images/read-url", init);
  }

  const response = await fetch(`${getApiBaseUrl()}/images/read-url`, init);
  if (!response.ok) throw new Error(`Azure image URL renewal failed (${response.status})`);
  return response.json() as Promise<ReadUrlResponse>;
};

/** Renews only Azure Blob read SAS URLs. Blob requests never receive API credentials. */
export const renewAzureReadUrl = (imageUrl: string): Promise<string> => {
  if (!isAzureBlobReadUrl(imageUrl)) return Promise.resolve(imageUrl);
  const current = inFlight.get(imageUrl);
  if (current) return current;

  const request = (async () => {
    const next = readImageUrl(await requestReadUrl(imageUrl));
    if (!next || !isAzureBlobReadUrl(next)) throw new Error("Azure image URL renewal returned an invalid URL");
    return next;
  })();

  inFlight.set(imageUrl, request);
  void request.then(
    () => inFlight.delete(imageUrl),
    () => inFlight.delete(imageUrl),
  );
  return request;
};
