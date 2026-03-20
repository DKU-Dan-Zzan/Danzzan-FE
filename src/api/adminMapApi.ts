import { getApiBaseUrl } from "@/api/common/baseUrl";
import { createFetchWithAuth } from "@/api/common/fetchAuth";
import { getAdminAccessToken, reissueAdminToken } from "../hooks/useAdminAuth";

const fetchWithAuth = createFetchWithAuth({
  getBaseUrl: getApiBaseUrl,
  getAccessToken: getAdminAccessToken,
  reissueAccessToken: reissueAdminToken,
  sessionExpiredMessage: "세션이 만료되었습니다. 다시 로그인해 주세요.",
  credentials: "include",
});

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
