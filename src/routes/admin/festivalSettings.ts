// 역할: 축제 설정(축제 이름/운영 날짜/티켓팅 회차)의 타입과 저장·불러오기를 담당한다.
//
// 저장소는 지금 브라우저 localStorage 다. 백엔드가 준비되면 loadFestivalSettings /
// saveFestivalSettings 안쪽만 API 호출로 바꾸면 화면 코드는 그대로 둘 수 있다.
// 백엔드에는 이미 festival_events 테이블(공연 날짜/티켓팅 시작 시각/수량/상태)이 있어
// 티켓팅 회차는 그 테이블에 대응시키면 된다.

export type TicketingRound = {
  id: string
  /** 티켓팅이 열리는 날짜와 시각. `2026-09-01T18:00` 형식 (datetime-local 입력값) */
  ticketingAt: string
  /** 이 회차에 풀 티켓 수량 */
  capacity: number
  /** 이 티켓으로 입장하는 공연 날짜. 운영 날짜 중 하나 */
  performanceDate: string
}

export type FestivalSettings = {
  festivalName: string
  startDate: string
  endDate: string
  ticketingEnabled: boolean
  ticketingRounds: TicketingRound[]
  /** 마지막 저장 시각. 비어 있으면 아직 한 번도 저장하지 않은 상태 */
  savedAt: string
}

const STORAGE_KEY = "danzzan.admin.festivalSettings"

const EMPTY_SETTINGS: FestivalSettings = {
  festivalName: "",
  startDate: "",
  endDate: "",
  ticketingEnabled: false,
  ticketingRounds: [],
  savedAt: "",
}

export function loadFestivalSettings(): FestivalSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_SETTINGS }

    const parsed = JSON.parse(raw) as Partial<FestivalSettings>
    return {
      ...EMPTY_SETTINGS,
      ...parsed,
      ticketingRounds: Array.isArray(parsed.ticketingRounds) ? parsed.ticketingRounds : [],
    }
  } catch {
    // 저장된 값이 깨졌으면 빈 설정으로 시작한다.
    return { ...EMPTY_SETTINGS }
  }
}

export function saveFestivalSettings(settings: FestivalSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // 저장에 실패해도 화면 동작은 막지 않는다.
  }
}

export function createEmptyTicketingRound(): TicketingRound {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `round-${Date.now()}`,
    ticketingAt: "",
    capacity: 0,
    performanceDate: "",
  }
}

/** 시작일부터 종료일까지의 날짜를 하루 간격으로 펼친다. 최대 14일까지만 만든다. */
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

function toDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
