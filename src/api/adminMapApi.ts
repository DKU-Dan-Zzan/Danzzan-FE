import { getAdminAccessToken, reissueAdminToken } from "../hooks/useAdminAuth";
import { getBaseUrl } from "./auth";

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

    const error = new Error(message) as Error & {
      status?: number;
      errors?: unknown;
    };

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
      credentials: "include",
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

export type AdminMapCollege = {
  id: number;
  name: string;
  locationX: number | null;
  locationY: number | null;
};

export type AdminMapBooth = {
  id: number;
  name: string;
  type: string;
  locationX: number | null;
  locationY: number | null;
  placed: boolean;
};

export type AdminMapResponse = {
  activeOperationDate: string;
  colleges: AdminMapCollege[];
  booths: AdminMapBooth[];
};

export async function getAdminMap(date?: string): Promise<AdminMapResponse> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";

  return fetchWithAuth<AdminMapResponse>(`/admin/map${query}`, {
    method: "GET",
  });
}

export async function updateActiveOperationDate(operationDate: string): Promise<void> {
  await fetchWithAuth<void>("/admin/map/active-date", {
    method: "PUT",
    body: JSON.stringify({ operationDate }),
  });
}

export async function updateCollegeLocation(
  collegeId: number,
  locationX: number,
  locationY: number,
): Promise<void> {
  await fetchWithAuth<void>(`/admin/map/colleges/${collegeId}/location`, {
    method: "PATCH",
    body: JSON.stringify({ locationX, locationY }),
  });
}

export async function updateBoothLocation(
  boothId: number,
  locationX: number,
  locationY: number,
): Promise<void> {
  await fetchWithAuth<void>(`/admin/map/booths/${boothId}/location`, {
    method: "PATCH",
    body: JSON.stringify({ locationX, locationY }),
  });
}

export async function clearBoothLocation(boothId: number): Promise<void> {
  await fetchWithAuth<void>(`/admin/map/booths/${boothId}/location`, {
    method: "DELETE",
  });
}