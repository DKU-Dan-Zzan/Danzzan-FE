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
  const raw = await fetchWithAuth<unknown>("/api/admin/notices/images/presign", {
    method: "POST",
    body: JSON.stringify(body),
  });

  // 백엔드 응답이 { presignedUrl, fileUrl } 또는 { data: { ... } } 형태일 수 있어 방어적으로 처리
  const record = raw as Record<string, unknown>;
  const maybeWrapped = (record?.data as Record<string, unknown> | undefined) ?? record;

  const presignedUrl = maybeWrapped?.presignedUrl;
  const fileUrl = maybeWrapped?.fileUrl;
  const imageUrl = maybeWrapped?.imageUrl;
  const method = (maybeWrapped?.method as "PUT" | undefined) ?? "PUT";
  const expiresAt = maybeWrapped?.expiresAt as string | undefined;

  if (typeof presignedUrl !== "string" || (!fileUrl && !imageUrl)) {
    throw new Error("presign 응답 형식이 올바르지 않습니다.");
  }

  return {
    presignedUrl,
    fileUrl: typeof fileUrl === "string" ? fileUrl : (imageUrl as string),
    imageUrl: typeof imageUrl === "string" ? imageUrl : undefined,
    method,
    expiresAt,
  };
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
