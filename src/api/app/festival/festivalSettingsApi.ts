// 역할: 축제 운영 정보(축제 이름/운영 날짜/티켓팅 회차) 조회·저장 API 어댑터.

import axios from "axios"
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
  /** 티켓팅이 이미 시작됐거나 티켓이 나간 회차. 고치거나 지울 수 없다. */
  locked?: boolean
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
  /**
   * 이미 저장된 회차는 id 를 함께 보낸다. id 가 빠지면 서버가 새 회차로 보고 예전 회차를
   * 지우려 하는데, 그 회차로 이미 티켓이 나갔다면 티켓의 근거가 사라진다.
   */
  ticketingRounds: TicketingRound[]
}

/**
 * 취소된 요청인지 본다.
 *
 * React 개발 모드는 effect 를 두 번 실행하고 첫 번째를 정리(abort)한다. 그 취소를
 * 실패로 처리하면 멀쩡히 불러왔는데도 "불러오지 못했습니다" 가 뜬다.
 */
export function isRequestAborted(error: unknown): boolean {
  if (axios.isCancel(error)) return true
  return error instanceof Error && error.name === "AbortError"
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
