// 역할: 축제 운영 날짜의 단일 출처. 서버(GET /festival/settings)가 준 날짜를 담아 두고,
// 화면들이 이 값으로 날짜 탭을 그린다.
//
// 예전에는 날짜가 코드에 박혀 있어 축제 때마다 코드를 고치고 배포해야 했다. 지금은
// 관리자 설정 페이지에서 저장한 운영 날짜가 여기에 들어온다.
//
// 서버 응답이 오기 전이나 아직 설정을 저장하지 않았을 때는 FALLBACK_FESTIVAL_DATES 를 쓴다.
// 화면이 빈 날짜 탭으로 깜빡이지 않게 하기 위한 대비책이다.

import type { FestivalDay } from "@/types/app/timetable/timetable.types"

/** 설정이 비어 있을 때 쓰는 기본값(2026 가을 축제). */
export const FALLBACK_FESTIVAL_DATES = ["2026-09-09", "2026-09-10"] as const

let operationDates: string[] = [...FALLBACK_FESTIVAL_DATES]

/**
 * 티켓팅 사용 여부. 설정에서 켜야 앱의 티켓팅 화면이 열린다.
 * 서버 응답 전에는 꺼진 것으로 본다. 잠깐 열렸다 닫히는 것보다 낫다.
 */
let ticketingEnabled = false
const listeners = new Set<() => void>()

/** 운영 날짜와 티켓팅 사용 여부를 함께 구독한다. */
function emit() {
  listeners.forEach((listener) => listener())
}

export function subscribeFestivalSettings(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getFestivalDates(): string[] {
  return operationDates
}

export function getDefaultFestivalDate(): string {
  return operationDates[0] ?? FALLBACK_FESTIVAL_DATES[0]
}

/**
 * 서버에서 받은 운영 날짜를 반영한다. 빈 목록이면 아직 설정 전이므로 기본값을 유지한다.
 */
export function setFestivalDates(dates: string[]): void {
  const next = dates.length > 0 ? dates : [...FALLBACK_FESTIVAL_DATES]
  if (next.length === operationDates.length && next.every((date, i) => date === operationDates[i])) {
    return
  }
  operationDates = next
  emit()
}

export function getTicketingEnabled(): boolean {
  return ticketingEnabled
}

export function setTicketingEnabled(enabled: boolean): void {
  if (ticketingEnabled === enabled) return
  ticketingEnabled = enabled
  emit()
}

export function isFestivalDate(date: string): boolean {
  return operationDates.includes(date)
}

/** "2026-09-09" -> "9/9" */
export function formatFestivalDateLabel(date: string): string {
  const [, month = "", day = ""] = date.split("-")
  return `${Number(month)}/${Number(day)}`
}

export type FestivalDateOption = {
  label: string
  value: string
}

export function toFestivalDateOptions(dates: string[]): FestivalDateOption[] {
  return dates.map((date) => ({ value: date, label: formatFestivalDateLabel(date) }))
}

/** 운영 날짜를 타임테이블이 쓰는 1일차/2일차 형태로 바꾼다. */
export function toFestivalDays(dates: string[]): FestivalDay[] {
  return dates.map((date, index) => ({
    key: `DAY-${index + 1}`,
    label: `${index + 1}일차`,
    date,
  }))
}

let ticketingBackgroundImageUrl: string | null = null
export function getTicketingBackgroundImageUrl(): string | null { return ticketingBackgroundImageUrl }
export function setTicketingBackgroundImageUrl(url: string | null): void {
  if (ticketingBackgroundImageUrl === url) return
  ticketingBackgroundImageUrl = url
  emit()
}

let ticketingOpenBackgroundImageUrl: string | null = null
export function getTicketingOpenBackgroundImageUrl(): string | null { return ticketingOpenBackgroundImageUrl }
export function setTicketingOpenBackgroundImageUrl(url: string | null): void {
  if (ticketingOpenBackgroundImageUrl === url) return
  ticketingOpenBackgroundImageUrl = url
  emit()
}
