import { getApiBaseUrl } from "@/api/common/baseUrl";
import { createFetchWithAuth } from "@/api/common/fetchAuth";
import { CURRENT_FESTIVAL_SETTING_ID } from "@/config/festivalSetting";
import { clearAdminSession, getAdminAccessToken, reissueAdminToken } from "@/lib/app/admin/admin-auth-session";
import { authStore } from "@/store/common/authStore";

export type AdminHomeImage = { id: number; imageUrl: string; displayOrder: number };
export type HomeImagePreviewRequest = { sourcePosterUrl: string; layout: "contain" | "cover"; focusX?: number; focusY?: number };
export type HomeImagePreview = { mimeType: string; imageBase64: string; width: number; height: number; sourcePosterUrl: string };

const request = createFetchWithAuth({
  getSessionEpoch: authStore.getSessionEpoch,
  getBaseUrl: getApiBaseUrl,
  getAccessToken: getAdminAccessToken,
  reissueAccessToken: reissueAdminToken,
  refreshKey: "admin-auth",
  credentials: "include",
  clearSession: clearAdminSession,
});

const path = (festivalSettingId: number) => `/admin/festival/${festivalSettingId}/home-images`;

export const adminHomeImageApi = {
  preview: (payload: HomeImagePreviewRequest, festivalSettingId = CURRENT_FESTIVAL_SETTING_ID, signal?: AbortSignal) =>
    request<HomeImagePreview>(`${path(festivalSettingId)}/preview`, { method: "POST", body: JSON.stringify(payload), signal }),
  stageUpload: (file: File, festivalSettingId = CURRENT_FESTIVAL_SETTING_ID, signal?: AbortSignal) => {
    const body = new FormData();
    body.append("file", file);
    return request<{ url: string }>(`${path(festivalSettingId)}/staged`, { method: "POST", body, signal });
  },
  list: (festivalSettingId = CURRENT_FESTIVAL_SETTING_ID, signal?: AbortSignal) =>
    request<AdminHomeImage[]>(path(festivalSettingId), { signal }),
  upload: (file: File, festivalSettingId = CURRENT_FESTIVAL_SETTING_ID) => {
    const body = new FormData();
    body.append("file", file);
    return request<AdminHomeImage>(path(festivalSettingId), { method: "POST", body });
  },
  delete: (id: number, festivalSettingId = CURRENT_FESTIVAL_SETTING_ID) =>
    request<void>(`${path(festivalSettingId)}/${id}`, { method: "DELETE" }),
  reorder: (imageIds: number[], festivalSettingId = CURRENT_FESTIVAL_SETTING_ID) =>
    request<AdminHomeImage[]>(`${path(festivalSettingId)}/order`, {
      method: "PUT", body: JSON.stringify({ imageIds }),
    }),
};
