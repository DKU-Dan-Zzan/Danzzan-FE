import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  FALLBACK_FESTIVAL_DATES,
  getDefaultFestivalDate,
  getFestivalDates,
  isFestivalDate,
  setFestivalDates,
  subscribeFestivalSettings,
  toFestivalDays,
} from "@/lib/app/festival/festivalCalendar"

/**
 * 운영 날짜는 서버 설정에서 온다. 설정 API 가 실패하거나 아직 저장 전이어도
 * 부스맵·타임테이블이 빈 날짜 탭이 되면 안 되므로 기본값으로 버틴다.
 */
describe("festivalCalendar", () => {
  beforeEach(() => {
    setFestivalDates([...FALLBACK_FESTIVAL_DATES])
  })

  it("빈 목록을 받으면 기본 날짜를 유지한다", () => {
    setFestivalDates([])

    expect(getFestivalDates()).toEqual([...FALLBACK_FESTIVAL_DATES])
    expect(getDefaultFestivalDate()).toBe(FALLBACK_FESTIVAL_DATES[0])
  })

  it("서버 날짜로 갈아끼우고 구독자에게 알린다", () => {
    const listener = vi.fn()
    const unsubscribe = subscribeFestivalSettings(listener)

    setFestivalDates(["2027-05-14", "2027-05-15", "2027-05-16"])

    expect(listener).toHaveBeenCalledTimes(1)
    expect(getDefaultFestivalDate()).toBe("2027-05-14")
    expect(isFestivalDate("2027-05-15")).toBe(true)
    expect(isFestivalDate("2026-09-09")).toBe(false)

    unsubscribe()
  })

  it("같은 날짜를 다시 넣으면 알리지 않는다", () => {
    const listener = vi.fn()
    const unsubscribe = subscribeFestivalSettings(listener)

    setFestivalDates([...FALLBACK_FESTIVAL_DATES])

    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })

  it("운영 날짜를 1일차부터 순서대로 매긴다", () => {
    expect(toFestivalDays(["2027-05-14", "2027-05-15"])).toEqual([
      { key: "DAY-1", label: "1일차", date: "2027-05-14" },
      { key: "DAY-2", label: "2일차", date: "2027-05-15" },
    ])
  })
})
