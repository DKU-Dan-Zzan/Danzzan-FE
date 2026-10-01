import { authStore } from "@/store/common/authStore";
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
  getSessionEpoch: authStore.getSessionEpoch,
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
  /** 티켓팅이 이미 시작된 회차. 내용을 고칠 수 없다(삭제는 확인 후 가능). */
  locked?: boolean
  /** 이 회차로 나간 티켓 수. 0 보다 크면 삭제할 때 확인을 받는다. */
  issuedTicketCount?: number
}

export type FestivalSettings = {
  schoolName: string
  festivalName: string
  startDate: string | null
  endDate: string | null
  /** 서버가 시작일~종료일을 하루씩 펼쳐서 내려준다. 아직 등록 전이면 빈 배열 */
  operationDates: string[]
  ticketingBackgroundImageUrl?: string | null
  ticketCardBackgroundImageUrl?: string | null
  ticketingEnabled: boolean
  ticketingRounds: TicketingRound[]
}

export type UpdateFestivalMetadataPayload = {
  schoolName: string
  festivalName: string
  startDate: string
  endDate: string
}

export type UpdateFestivalTicketingPayload = {
  ticketingBackgroundImageUrl?: string | null
  ticketCardBackgroundImageUrl?: string | null
  ticketingEnabled: boolean
  /**
   * 이미 저장된 회차는 id 를 함께 보낸다. id 가 빠지면 서버가 새 회차로 보고 예전 회차를
   * 지우려 하는데, 그 회차로 이미 티켓이 나갔다면 티켓의 근거가 사라진다.
   */
  ticketingRounds: TicketingRound[]
  /**
   * 발급된 티켓까지 함께 취소하기로 확인한 회차 id.
   * 티켓이 나간 회차는 이 목록에 있을 때만 서버가 지운다.
   */
  confirmedTicketCancelRoundIds: number[]
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
export async function updateFestivalMetadata(
  payload: UpdateFestivalMetadataPayload,
): Promise<FestivalSettings> {
  return fetchWithAuth<FestivalSettings>("/admin/festival/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function updateFestivalTicketingSettings(
  payload: UpdateFestivalTicketingPayload,
): Promise<FestivalSettings> {
  return fetchWithAuth<FestivalSettings>("/admin/festival/ticketing-settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function uploadTicketingBackground(file: File): Promise<{ url: string }> {
  const body = new FormData()
  body.append("file", file)
  return fetchWithAuth("/admin/festival/ticketing-background", { method: "POST", body })
}
