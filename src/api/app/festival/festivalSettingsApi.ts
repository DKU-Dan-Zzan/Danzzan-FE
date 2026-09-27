// 역할: 축제 운영 정보(축제 이름/운영 날짜/티켓팅 회차) 조회·저장 API 어댑터.

import { http } from "@/lib/http"
import { getApiBaseUrl } from "@/api/common/baseUrl"
import { createFetchWithAuth } from "@/api/common/fetchAuth"
import {
  clearAdminSession,
  getAdminAccessToken,
  reissueAdminToken,
} from "@/lib/app/admin/admin-auth-session"

const fetchWithAuth = createFetchWithAuth({
  getBaseUrl: getApiBaseUrl,
  getAccessToken: getAdminAccessToken,
  reissueAccessToken: reissueAdminToken,
  refreshKey: "admin-auth",
  sessionExpiredMessage: "세션이 만료되었습니다. 다시 로그인해 주세요.",
  credentials: "include",
  clearSession: clearAdminSession,
})

export type TicketingRound = {
  id?: number
  /** `2027-05-01T18:00:00` 형식 */
  ticketingAt: string
  capacity: number
  /** 운영 날짜 중 하나 */
  performanceDate: string
}

export type FestivalSettings = {
  schoolName: string
  festivalName: string
  startDate: string | null
  endDate: string | null
  /** 서버가 시작일~종료일을 하루씩 펼쳐서 내려준다. 아직 등록 전이면 빈 배열 */
  operationDates: string[]
  ticketingEnabled: boolean
  ticketingRounds: TicketingRound[]
}

export type UpdateFestivalSettingsPayload = {
  schoolName: string
  festivalName: string
  startDate: string
  endDate: string
  ticketingEnabled: boolean
  ticketingRounds: Omit<TicketingRound, "id">[]
}

/** 공개 API. 로그인 없이도 부르며, 사용자 화면의 날짜 탭도 이 값을 쓴다. */
export async function getFestivalSettings(options?: { signal?: AbortSignal }) {
  const res = await http.get<FestivalSettings>("/festival/settings", { signal: options?.signal })
  return res.data
}

/** 관리자 전용. 보낸 티켓팅 회차가 저장된 회차를 통째로 대신한다. */
export async function updateFestivalSettings(
  payload: UpdateFestivalSettingsPayload,
): Promise<FestivalSettings> {
  // 실패하면 서버 메시지를 담은 Error 를 던진다(fetchWithAuth 가 처리).
  return fetchWithAuth<FestivalSettings>("/admin/festival/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}
