import { authStore } from "@/store/common/authStore"
import { getApiBaseUrl } from "@/api/common/baseUrl"
import { createFetchWithAuth } from "@/api/common/fetchAuth"
import { clearAdminSession, getAdminAccessToken, reissueAdminToken } from "@/lib/app/admin/admin-auth-session"

const request = createFetchWithAuth({
  getSessionEpoch: authStore.getSessionEpoch,
  getBaseUrl: getApiBaseUrl,
  getAccessToken: getAdminAccessToken,
  reissueAccessToken: reissueAdminToken,
  refreshKey: "admin-auth",
  credentials: "include",
  clearSession: clearAdminSession,
})

export type BackgroundTarget = "ticket" | "closed"
export type PosterBackgroundRecommendation = {
  target: BackgroundTarget
  mimeType: "image/jpeg"
  imageBase64: string
  width: number
  height: number
  focusX: number
  focusY: number
  sourcePosterUrl?: string
  reason: string
}

export async function recommendPosterBackground(target: BackgroundTarget, signal?: AbortSignal, sourcePosterUrl?: string) {
  return request<PosterBackgroundRecommendation>("/admin/festival/ticketing-background/recommend", {
    method: "POST", body: JSON.stringify({ target, ...(sourcePosterUrl ? { sourcePosterUrl } : {}) }), signal,
  })
}

export function recommendationFile(result: PosterBackgroundRecommendation): File {
  if (result.mimeType !== "image/jpeg" || !["ticket", "closed"].includes(result.target)
    || !result.imageBase64 || result.imageBase64.length > 14 * 1024 * 1024) {
    throw new Error("AI 배경 이미지가 올바르지 않습니다.")
  }
  const bytes = Uint8Array.from(atob(result.imageBase64), character => character.charCodeAt(0))
  if (bytes.length > 10 * 1024 * 1024 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    throw new Error("AI 배경 이미지가 올바르지 않습니다.")
  }
  return new File([bytes], `poster-ai-${result.target}.jpg`, { type: "image/jpeg" })
}
