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
export type ThemeBundleRequest = ThemeUpsertRequest & { sourcePosterUrl: string; ticketCardBackgroundImageUrl: string; ticketingBackgroundImageUrl: string };
export type ThemeRecommendationRequest = { sourceColors: string[]; selectedBaseColor: string };
export type ThemeRecommendationCandidate = {
  id: "balanced" | "vibrant" | "deep";
  name: string;
  description: string;
  themeData: ThemeData;
};
export type ThemeRecommendationResponse = { candidates: ThemeRecommendationCandidate[] };

const recommendationColorFields = {
  brand: ["primary", "secondary", "accent", "strong"],
  status: ["success", "warning", "danger", "pending"],
  category: ["pub", "foodTruck", "experience", "event", "restArea", "facility"],
} as const;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The shared fetch client only casts JSON; validate this AI response before it reaches React state. */
export function parseThemeRecommendationResponse(value: unknown): ThemeRecommendationResponse {
  const candidates = isObject(value) ? value.candidates : undefined;
  const ids = new Set(["balanced", "vibrant", "deep"]);
  if (!Array.isArray(candidates) || candidates.length < 1 || candidates.length > 3 || !candidates.every((candidate) => {
    if (!isObject(candidate) || typeof candidate.id !== "string" || !ids.delete(candidate.id)
      || typeof candidate.name !== "string" || !candidate.name.trim()
      || typeof candidate.description !== "string" || !candidate.description.trim()
      || !isObject(candidate.themeData)) return false;
    const themeData = candidate.themeData;
    return Object.entries(recommendationColorFields).every(([group, keys]) => {
      const colors = themeData[group];
      return isObject(colors) && keys.every((key) =>
        typeof colors[key] === "string" && /^#[0-9a-fA-F]{6}$/.test(colors[key]));
    });
  })) {
    throw new Error("AI_THEME_RESPONSE_INVALID");
  }
  return { candidates: candidates as ThemeRecommendationCandidate[] };
}

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
  applyBundle: (payload: ThemeBundleRequest) => request<ActiveThemeResponse>(`${basePath}/apply-bundle`, { method: "POST", body: JSON.stringify(payload) }),
  recommend: async (payload: ThemeRecommendationRequest, signal?: AbortSignal) => parseThemeRecommendationResponse(
    await request<unknown>(`${basePath}/recommend`, { method: "POST", body: JSON.stringify(payload), signal }),
  ),
};
