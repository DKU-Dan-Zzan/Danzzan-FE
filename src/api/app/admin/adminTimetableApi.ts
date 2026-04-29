// 역할: 관리자 타임테이블(공연/아티스트) CRUD 및 이미지 presign API 어댑터.

import { getApiBaseUrl } from "@/api/common/baseUrl";
import { createFetchWithAuth } from "@/api/common/fetchAuth";
import { parseNoticeImagePresignContract } from "@/api/app/admin/adminContract";
import {
  clearAdminSession,
  getAdminAccessToken,
  reissueAdminToken,
} from "@/lib/app/admin/admin-auth-session";

const fetchWithAuth = createFetchWithAuth({
  getBaseUrl: getApiBaseUrl,
  getAccessToken: getAdminAccessToken,
  reissueAccessToken: reissueAdminToken,
  refreshKey: "admin-auth",
  sessionExpiredMessage: "세션이 만료되었습니다. 다시 로그인해 주세요.",
  credentials: "include",
  clearSession: clearAdminSession,
});

export type AdminPerformance = {
  performanceId: number;
  performanceDate: string;
  startTime: string;
  endTime: string;
  stage: string | null;
  artistId: number;
  artistName: string;
  artistImageUrl: string | null;
  artistDescription: string | null;
};

export type AdminPerformanceListResponse = {
  date: string;
  performances: AdminPerformance[];
};

export type CreatePerformancePayload = {
  artistId: number;
  performanceDate: string;
  startTime: string;
  endTime: string;
  stage?: string | null;
};

export type UpdatePerformancePayload = {
  artistId?: number;
  performanceDate?: string;
  startTime?: string;
  endTime?: string;
  stage?: string | null;
};

export type AdminArtist = {
  artistId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
};

export type CreateArtistPayload = {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
};

export type UpdateArtistPayload = {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
};

export type AdminArtistImagePresignRequest = {
  fileName: string;
  contentType: string;
  fileSize?: number;
};

export type AdminArtistImagePresignResponse = {
  presignedUrl: string;
  fileUrl: string;
  imageUrl?: string;
  expiresAt?: string;
  method: "PUT";
};

export async function getAdminPerformancesByDate(
  date: string,
): Promise<AdminPerformanceListResponse> {
  return fetchWithAuth<AdminPerformanceListResponse>(
    `/admin/timetable/performances?date=${encodeURIComponent(date)}`,
    { method: "GET" },
  );
}

export async function createAdminPerformance(
  payload: CreatePerformancePayload,
): Promise<AdminPerformance> {
  return fetchWithAuth<AdminPerformance>("/admin/timetable/performances", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminPerformance(
  performanceId: number,
  payload: UpdatePerformancePayload,
): Promise<AdminPerformance> {
  return fetchWithAuth<AdminPerformance>(
    `/admin/timetable/performances/${performanceId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteAdminPerformance(performanceId: number): Promise<void> {
  await fetchWithAuth<void>(`/admin/timetable/performances/${performanceId}`, {
    method: "DELETE",
  });
}

export async function getAdminArtists(): Promise<AdminArtist[]> {
  return fetchWithAuth<AdminArtist[]>("/admin/timetable/artists", {
    method: "GET",
  });
}

export async function createAdminArtist(
  payload: CreateArtistPayload,
): Promise<AdminArtist> {
  return fetchWithAuth<AdminArtist>("/admin/timetable/artists", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminArtist(
  artistId: number,
  payload: UpdateArtistPayload,
): Promise<AdminArtist> {
  return fetchWithAuth<AdminArtist>(`/admin/timetable/artists/${artistId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminArtist(artistId: number): Promise<void> {
  await fetchWithAuth<void>(`/admin/timetable/artists/${artistId}`, {
    method: "DELETE",
  });
}

export async function getAdminArtistImagePresign(
  artistId: number,
  payload: AdminArtistImagePresignRequest,
): Promise<AdminArtistImagePresignResponse> {
  const endpoint = `/admin/timetable/artists/${artistId}/images/presign`;
  const raw = await fetchWithAuth<unknown>(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const parsed = parseNoticeImagePresignContract(raw, endpoint);
  return {
    presignedUrl: parsed.presignedUrl,
    fileUrl: parsed.fileUrl,
    imageUrl: parsed.imageUrl,
    expiresAt: parsed.expiresAt,
    method: parsed.method,
  };
}
