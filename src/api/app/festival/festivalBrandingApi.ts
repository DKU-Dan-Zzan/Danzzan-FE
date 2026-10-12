import { authStore } from "@/store/common/authStore";
import { getApiBaseUrl } from "@/api/common/baseUrl";
import { createFetchWithAuth } from "@/api/common/fetchAuth";
import { http } from "@/lib/http";
import { clearAdminSession, getAdminAccessToken, reissueAdminToken } from "@/lib/app/admin/admin-auth-session";
import { CURRENT_FESTIVAL_SETTING_ID } from "@/config/festivalSetting";

export type FestivalBranding = {
  festivalSettingId: number;
  posterImageUrl: string | null;
  logoImageUrl: string | null;
};

export type BrandingImageKind = "poster" | "logo";

export type PosterColorCandidate = { hex: string; population: number };
export type PosterColorResponse = { colors: PosterColorCandidate[] };

const fetchWithAuth = createFetchWithAuth({
  getSessionEpoch: authStore.getSessionEpoch,
  getBaseUrl: getApiBaseUrl,
  getAccessToken: getAdminAccessToken,
  reissueAccessToken: reissueAdminToken,
  refreshKey: "admin-auth",
  credentials: "include",
  clearSession: clearAdminSession,
});

const brandingPath = (festivalSettingId: number) => `/festival/${festivalSettingId}/branding`;

export const festivalBrandingApi = {
  async get(festivalSettingId = CURRENT_FESTIVAL_SETTING_ID, signal?: AbortSignal): Promise<FestivalBranding> {
    const response = await http.get<FestivalBranding>(brandingPath(festivalSettingId), { signal });
    return response.data;
  },
  async upload(kind: BrandingImageKind, file: File, festivalSettingId = CURRENT_FESTIVAL_SETTING_ID): Promise<FestivalBranding> {
    const body = new FormData();
    body.append("file", file);
    return fetchWithAuth<FestivalBranding>(`/admin${brandingPath(festivalSettingId)}/${kind}`, { method: "POST", body });
  },
  extractPosterColors(festivalSettingId = CURRENT_FESTIVAL_SETTING_ID): Promise<PosterColorResponse> {
    return fetchWithAuth<PosterColorResponse>(`/admin/festival/${festivalSettingId}/theme-colors/extract`, { method: "POST" });
  },
};
