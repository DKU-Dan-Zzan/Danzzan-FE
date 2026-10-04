import { getApiBaseUrl } from "@/api/common/baseUrl";
import { createFetchWithAuth } from "@/api/common/fetchAuth";
import type { ActiveThemeResponse, ThemeData } from "@/api/app/festival/activeThemeApi";
import { CURRENT_FESTIVAL_SETTING_ID } from "@/config/festivalSetting";
import { authStore } from "@/store/common/authStore";
import {
  clearAdminSession,
  getAdminAccessToken,
  reissueAdminToken,
} from "@/lib/app/admin/admin-auth-session";

export type ThemeProvenance = {
  sourcePosterUrl: string | null;
  selectedBaseColor: string | null;
  sourceColors: string[] | null;
};
export type ThemeUpsertRequest = { name: string; themeData: ThemeData } & Partial<ThemeProvenance>;
export type ThemeRecommendationRequest = { sourceColors: string[]; selectedBaseColor: string };

const request = createFetchWithAuth({
  getSessionEpoch: authStore.getSessionEpoch,
  getBaseUrl: getApiBaseUrl,
  getAccessToken: getAdminAccessToken,
  reissueAccessToken: reissueAdminToken,
  refreshKey: "admin-auth",
  credentials: "include",
  clearSession: clearAdminSession,
});

const basePath = `/admin/festival/${CURRENT_FESTIVAL_SETTING_ID}/themes`;

export const adminThemeApi = {
  list: (signal?: AbortSignal) => request<ActiveThemeResponse[]>(basePath, { signal }),
  get: (id: number, signal?: AbortSignal) => request<ActiveThemeResponse>(`${basePath}/${id}`, { signal }),
  create: (payload: ThemeUpsertRequest) => request<ActiveThemeResponse>(basePath, {
    method: "POST", body: JSON.stringify(payload),
  }),
  update: (id: number, payload: ThemeUpsertRequest) => request<ActiveThemeResponse>(`${basePath}/${id}`, {
    method: "PUT", body: JSON.stringify(payload),
  }),
  delete: (id: number) => request<void>(`${basePath}/${id}`, { method: "DELETE" }),
  activate: (id: number) => request<ActiveThemeResponse>(`${basePath}/${id}/activate`, { method: "PUT" }),
  recommend: (payload: ThemeRecommendationRequest) => request<ThemeData>(`${basePath}/recommend`, {
    method: "POST", body: JSON.stringify(payload),
  }),
};
