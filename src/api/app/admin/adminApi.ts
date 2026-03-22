import { getApiBaseUrl } from "@/api/common/baseUrl";
import { createFetchWithAuth } from "@/api/common/fetchAuth";
import {
  clearAdminSession,
  getAdminAccessToken,
  reissueAdminToken,
} from "@/lib/app/admin/admin-auth-session";
import {
  parseAdImageUploadContract,
  parseNoticeImagePresignContract,
} from "@/api/app/admin/adminContract";

const fetchWithAuth = createFetchWithAuth({
  getBaseUrl: getApiBaseUrl,
  getAccessToken: getAdminAccessToken,
  reissueAccessToken: reissueAdminToken,
  refreshKey: "admin-auth",
  sessionExpiredMessage: "세션이 만료되었습니다. 다시 로그인해 주세요.",
  clearSession: clearAdminSession,
});

type RequestOptions = {
  signal?: AbortSignal;
};

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

export async function getEmergencyAdminNotice(
  options?: RequestOptions,
): Promise<EmergencyNoticeResponse> {
  return fetchWithAuth<EmergencyNoticeResponse>("/api/admin/emergency", {
    method: "GET",
    signal: options?.signal,
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

export type NoticeStatusFilter = "ACTIVE" | "DELETED" | "ALL";

export type NoticeResponse = {
  id: number;
  title: string;
  content: string;
  author: string;
  category?: string | null;
  isPinned?: boolean;
  thumbnailImageUrl?: string | null;
  displayOrder?: number | null;
  imageUrls?: string[];
  isEmergency?: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateNoticeRequest = {
  title: string;
  content: string;
  author: string;
  category?: string | null;
  isPinned?: boolean;
  thumbnailImageUrl?: string | null;
  images?: string[];
};

export type UpdateNoticeRequest = CreateNoticeRequest;

type NoticeListParams = {
  keyword?: string;
  category?: string;
  status?: NoticeStatusFilter;
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
  options?: RequestOptions,
): Promise<PageResponse<NoticeResponse>> {
  const query = buildQuery({
    keyword: params.keyword,
    category: params.category,
    status: params.status,
    page: params.page ?? 0,
    size: params.size ?? 10,
  });
  return fetchWithAuth<PageResponse<NoticeResponse>>(`/api/admin/notices${query}`, {
    method: "GET",
    signal: options?.signal,
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

export async function restoreAdminNotice(id: number): Promise<NoticeResponse> {
  return fetchWithAuth<NoticeResponse>(`/api/admin/notices/${id}/restore`, {
    method: "PATCH",
  });
}

type NoticeDisplayOrderItem = {
  id: number;
  displayOrder: number;
};

export type UpdateNoticeDisplayOrderRequest = {
  orders: NoticeDisplayOrderItem[];
};

export type NoticeImagePresignRequest = {
  fileName: string;
  contentType: string;
  fileSize?: number;
};

export type NoticeImagePresignResponse = {
  presignedUrl: string;
  fileUrl: string;
  imageUrl?: string;
  expiresAt?: string;
  method: "PUT";
};

export async function updateNoticeDisplayOrder(
  body: UpdateNoticeDisplayOrderRequest,
): Promise<void> {
  await fetchWithAuth<void>("/api/admin/notices/display-order", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function getNoticeImagePresign(
  body: NoticeImagePresignRequest,
): Promise<NoticeImagePresignResponse> {
  const endpoint = "/api/admin/notices/images/presign";
  const raw = await fetchWithAuth<unknown>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return parseNoticeImagePresignContract(raw, endpoint);
}

export type AdImageUploadRequest = {
  fileName: string;
  contentType: string;
  fileSize?: number;
};

type AdImageUploadResponseCommon = {
  presignedUrl: string;
  imageUrl: string;
  method: "PUT";
  expiresAt?: string;
};

export async function getAdminAdUploadUrl(
  body: AdImageUploadRequest,
): Promise<AdImageUploadResponseCommon> {
  const endpoint = "/api/admin/ads/upload-url";
  const raw = await fetchWithAuth<unknown>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return parseAdImageUploadContract(raw, endpoint);
}

export async function getAdminAdImagePresign(
  body: AdImageUploadRequest,
): Promise<AdImageUploadResponseCommon> {
  const endpoint = "/api/admin/ads/images/presign";
  const raw = await fetchWithAuth<unknown>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return parseAdImageUploadContract(raw, endpoint);
}

/**
 * 백엔드가 두 가지 업로드 프리사인 엔드포인트 중 무엇을 제공하든(예: /upload-url 또는 /images/presign)
 * 프론트는 동일한 인터페이스로 업로드 URL을 얻도록 합니다.
 */
export async function getAdminAdImageUpload(
  body: AdImageUploadRequest,
): Promise<AdImageUploadResponseCommon> {
  try {
    return await getAdminAdImagePresign(body);
  } catch (error) {
    const err = error as Error & { status?: number };
    if (err.status === 404 || err.status === 405) {
      return await getAdminAdUploadUrl(body);
    }
    throw error;
  }
}

export type AdvertisementPlacement = "HOME_BOTTOM" | "MY_TICKET";

export type AdvertisementResponse = {
  id: number;
  title: string;
  imageUrl: string;
  placement: AdvertisementPlacement;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdvertisementRequest = {
  title: string;
  imageUrl: string;
  placement: AdvertisementPlacement;
};

export async function createAdminAd(
  body: CreateAdvertisementRequest,
): Promise<AdvertisementResponse> {
  return fetchWithAuth<AdvertisementResponse>("/api/admin/ads", {
    method: "POST",
    body: JSON.stringify(body),
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

export async function setAdminAdsActiveByPlacement(
  placement: AdvertisementPlacement,
  isActive: boolean,
): Promise<void> {
  await fetchWithAuth<void>(`/api/admin/ads/${placement}/active`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export async function deleteAdminAd(id: number): Promise<void> {
  await fetchWithAuth<void>(`/api/admin/ads/${id}`, {
    method: "DELETE",
  });
}
