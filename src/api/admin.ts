import { getAdminAccessToken, reissueAdminToken } from "../hooks/useAdminAuth";
import { getBaseUrl } from "../api/auth";

type ApiErrorBody = {
  status?: number;
  message?: string;
  errors?: unknown;
};

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const raw = text ? (JSON.parse(text) as unknown) : {};
  const data = raw as ApiErrorBody & T;

  if (!res.ok) {
    const message =
      (data as ApiErrorBody).message ??
      (data as { error?: string })?.error ??
      `요청 실패 (${res.status})`;
    const error = new Error(message) as Error & { status?: number; errors?: unknown };
    error.status = (data as ApiErrorBody).status ?? res.status;
    error.errors = (data as ApiErrorBody).errors;
    throw error;
  }

  return data as T;
}

async function fetchWithAuth<T>(input: string, init: RequestInit = {}): Promise<T> {
  const base = getBaseUrl();
  const token = getAdminAccessToken();

  const commonHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers || {}),
  };

  if (token) {
    (commonHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const makeRequest = (accessToken?: string) =>
    fetch(`${base}${input}`, {
      ...init,
      headers: {
        ...commonHeaders,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

  let res = await makeRequest(token ?? undefined);

  if (res.status === 401) {
    const newToken = await reissueAdminToken();
    if (!newToken) {
      throw new Error("세션이 만료되었습니다. 다시 로그인해 주세요.");
    }
    res = await makeRequest(newToken);
  }

  return handleResponse<T>(res);
}

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
};

// 2-2. 긴급 공지

export type EmergencyNoticeResponse = {
  id: number;
  message: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateEmergencyRequest = {
  message?: string;
  isActive?: boolean;
};

export async function getEmergencyAdminNotice(): Promise<EmergencyNoticeResponse> {
  return fetchWithAuth<EmergencyNoticeResponse>("/api/admin/emergency", {
    method: "GET",
  });
}

export async function updateEmergencyAdminNotice(
  body: UpdateEmergencyRequest,
): Promise<EmergencyNoticeResponse> {
  return fetchWithAuth<EmergencyNoticeResponse>("/api/admin/emergency", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// 2-3. 일반 공지

export type NoticeResponse = {
  id: number;
  title: string;
  content: string;
  author: string;
  imageUrls?: string[];
  isEmergency: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateNoticeRequest = {
  title: string;
  content: string;
  author: string;
  isEmergency?: boolean;
  imageUrls?: string[];
};

export type UpdateNoticeRequest = {
  title: string;
  content: string;
  author: string;
  isEmergency?: boolean;
  imageUrls?: string[];
};

type NoticeListParams = {
  keyword?: string;
  page?: number;
  size?: number;
};

function buildQuery(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function getAdminNotices(
  params: NoticeListParams,
): Promise<PageResponse<NoticeResponse>> {
  const query = buildQuery({
    keyword: params.keyword,
    page: params.page ?? 0,
    size: params.size ?? 10,
  });
  return fetchWithAuth<PageResponse<NoticeResponse>>(`/api/admin/notices${query}`, {
    method: "GET",
  });
}

export async function createAdminNotice(
  body: CreateNoticeRequest,
): Promise<NoticeResponse> {
  return fetchWithAuth<NoticeResponse>("/api/admin/notices", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminNotice(
  id: number,
  body: UpdateNoticeRequest,
): Promise<NoticeResponse> {
  return fetchWithAuth<NoticeResponse>(`/api/admin/notices/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminNotice(id: number): Promise<void> {
  await fetchWithAuth<void>(`/api/admin/notices/${id}`, {
    method: "DELETE",
  });
}
// 3. 분실물

export type LostItemStatusFilter = "ALL" | "UNCLAIMED" | "CLAIMED";

export type LostItemResponse = {
  id: number;
  itemName: string;
  imageUrl: string | null;
  foundLocation: string;
  foundDate: string; // yyyy-MM-dd
  isClaimed: boolean;
  receiverName: string | null;
  receiverNote: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateLostItemRequest = {
  itemName: string;
  imageUrl?: string | null;
  foundLocation: string;
  foundDate: string;
  isClaimed?: boolean;
  receiverName?: string | null;
  receiverNote?: string | null;
};

export type UpdateLostItemRequest = {
  itemName: string;
  imageUrl?: string | null;
  foundLocation: string;
  foundDate: string;
  isClaimed: boolean;
  receiverName?: string | null;
  receiverNote?: string | null;
};

type LostItemListParams = {
  status?: LostItemStatusFilter;
  page?: number;
  size?: number;
};

export async function getAdminLostItems(
  params: LostItemListParams,
): Promise<PageResponse<LostItemResponse>> {
  const query = buildQuery({
    status: params.status,
    page: params.page ?? 0,
    size: params.size ?? 10,
  });

  return fetchWithAuth<PageResponse<LostItemResponse>>(
    `/api/admin/lost-items${query}`,
    { method: "GET" },
  );
}

export async function createAdminLostItem(
  body: CreateLostItemRequest,
): Promise<LostItemResponse> {
  return fetchWithAuth<LostItemResponse>("/api/admin/lost-items", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminLostItem(
  id: number,
  body: UpdateLostItemRequest,
): Promise<LostItemResponse> {
  return fetchWithAuth<LostItemResponse>(`/api/admin/lost-items/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminLostItem(id: number): Promise<void> {
  await fetchWithAuth<void>(`/api/admin/lost-items/${id}`, {
    method: "DELETE",
  });
}

// 4. 광고 관리자

export type AdvertisementPlacement = "HOME" | "BOOTH_LIST" | "MAP" | "TICKET" | "GLOBAL";

export type AdvertisementResponse = {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  placement: AdvertisementPlacement | string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  isActive: boolean;
  priority?: number | null;
  createdAt: string;
};

export type CreateAdvertisementRequest = {
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  placement: AdvertisementPlacement;
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority?: number | null;
};

export type UpdateAdvertisementRequest = CreateAdvertisementRequest;

export type AdUploadUrlRequest = {
  fileName: string;
  contentType: string;
  fileSize?: number;
};

export type AdUploadUrlResponse = {
  presignedUrl: string;
  imageUrl: string;
  key: string;
  expiresAt: string;
  method: "PUT";
};

type AdminAdListParams = {
  page?: number;
  size?: number;
};

export async function getAdminAdUploadUrl(
  body: AdUploadUrlRequest,
): Promise<AdUploadUrlResponse> {
  return fetchWithAuth<AdUploadUrlResponse>("/api/admin/ads/upload-url", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getAdminAds(
  params: AdminAdListParams,
): Promise<PageResponse<AdvertisementResponse>> {
  const query = buildQuery({
    page: params.page ?? 0,
    size: params.size ?? 20,
  });

  return fetchWithAuth<PageResponse<AdvertisementResponse>>(`/api/admin/ads${query}`, {
    method: "GET",
  });
}

export async function getAdminAd(id: number): Promise<AdvertisementResponse> {
  return fetchWithAuth<AdvertisementResponse>(`/api/admin/ads/${id}`, {
    method: "GET",
  });
}

export async function createAdminAd(
  body: CreateAdvertisementRequest,
): Promise<AdvertisementResponse> {
  return fetchWithAuth<AdvertisementResponse>("/api/admin/ads", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminAd(
  id: number,
  body: UpdateAdvertisementRequest,
): Promise<AdvertisementResponse> {
  return fetchWithAuth<AdvertisementResponse>(`/api/admin/ads/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminAd(id: number): Promise<void> {
  await fetchWithAuth<void>(`/api/admin/ads/${id}`, {
    method: "DELETE",
  });
}

export async function toggleAdminAdActive(
  id: number,
  isActive: boolean,
): Promise<AdvertisementResponse> {
  return fetchWithAuth<AdvertisementResponse>(`/api/admin/ads/${id}/active`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}
