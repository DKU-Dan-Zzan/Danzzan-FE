// 역할: 설정 페이지가 쓰는 화면용 모델과, 서버 응답/요청 사이의 변환을 담당한다.
//
// 서버는 티켓팅 시각을 `2027-05-01T18:00:00` 로 주고받는데, 화면의 datetime-local
// 입력은 초가 없는 `2027-05-01T18:00` 을 쓴다. 그 차이를 여기서 흡수한다.

import type {
  FestivalSettings as FestivalSettingsDto,
  UpdateFestivalSettingsPayload,
} from "@/api/app/festival/festivalSettingsApi"

export type TicketingRound = {
  /** 화면에서 목록을 다루기 위한 키. 서버 id 가 아니다. */
  key: string
  /** datetime-local 입력값 (`2027-05-01T18:00`) */
  ticketingAt: string
  capacity: number
  performanceDate: string
}

export type FestivalSettingsForm = {
  schoolName: string
  festivalName: string
  startDate: string
  endDate: string
  ticketingEnabled: boolean
  ticketingRounds: TicketingRound[]
}

export const EMPTY_FESTIVAL_SETTINGS_FORM: FestivalSettingsForm = {
  schoolName: "단국대학교",
  festivalName: "",
  startDate: "",
  endDate: "",
  ticketingEnabled: false,
  ticketingRounds: [],
}

export function toForm(dto: FestivalSettingsDto): FestivalSettingsForm {
  return {
    schoolName: dto.schoolName || EMPTY_FESTIVAL_SETTINGS_FORM.schoolName,
    festivalName: dto.festivalName,
    startDate: dto.startDate ?? "",
    endDate: dto.endDate ?? "",
    ticketingEnabled: dto.ticketingEnabled,
    ticketingRounds: dto.ticketingRounds.map((round, index) => ({
      key: round.id != null ? String(round.id) : `round-${index}`,
      ticketingAt: toInputDateTime(round.ticketingAt),
      capacity: round.capacity,
      performanceDate: round.performanceDate,
    })),
  }
}

export function toPayload(form: FestivalSettingsForm): UpdateFestivalSettingsPayload {
  return {
    schoolName: form.schoolName,
    festivalName: form.festivalName.trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    ticketingEnabled: form.ticketingEnabled,
    ticketingRounds: form.ticketingEnabled
      ? form.ticketingRounds.map((round) => ({
          ticketingAt: toServerDateTime(round.ticketingAt),
          capacity: round.capacity,
          performanceDate: round.performanceDate,
        }))
      : [],
  }
}

export function createEmptyTicketingRound(): TicketingRound {
  return {
    key:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `round-${Date.now()}`,
    ticketingAt: "",
    capacity: 0,
    performanceDate: "",
  }
}

/** 시작일부터 종료일까지 하루 간격으로 펼친다. 서버와 같은 14일 상한을 쓴다. */
export function buildFestivalDateRange(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate) return []

  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return []

  const dates: string[] = []
  const cursor = new Date(start)
  while (cursor <= end && dates.length < 14) {
    dates.push(toDateString(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

export function formatDateLabel(date: string): string {
  if (!date) return "-"
  const [, month = "", day = ""] = date.split("-")
  return `${Number(month)}/${Number(day)}`
}

/** `2027-05-01T18:00:00` -> `2027-05-01T18:00` */
function toInputDateTime(value: string): string {
  return value.length >= 16 ? value.slice(0, 16) : value
}

/** `2027-05-01T18:00` -> `2027-05-01T18:00:00` */
function toServerDateTime(value: string): string {
  return value.length === 16 ? `${value}:00` : value
}

function toDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
