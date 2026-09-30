import { describe, expect, it } from "vitest"

import {
  buildFestivalDateRange,
  toForm,
  toTicketingPayload,
  type FestivalSettingsForm,
} from "@/routes/admin/festivalSettings"

/**
 * 서버는 초까지 담은 `18:00:00` 을 주고받고, 화면의 datetime-local 입력은 `18:00` 을 쓴다.
 * 이 변환이 어긋나면 저장은 되는데 다시 열었을 때 시각 칸이 비어 보인다.
 */
describe("festivalSettings 변환", () => {
  it("서버 응답의 티켓팅 시각을 입력칸 형식으로 줄인다", () => {
    const form = toForm({
      schoolName: "단국대학교",
      festivalName: "2027 DANFESTA",
      startDate: "2027-05-14",
      endDate: "2027-05-16",
      operationDates: ["2027-05-14", "2027-05-15", "2027-05-16"],
      ticketingEnabled: true,
      ticketingRounds: [
        { id: 7, ticketingAt: "2027-05-01T18:00:00", capacity: 1500, performanceDate: "2027-05-15" },
      ],
    })

    expect(form.ticketingRounds[0].ticketingAt).toBe("2027-05-01T18:00")
    expect(form.ticketingRounds[0].key).toBe("7")
  })

  it("저장할 때 티켓팅 시각에 초를 붙인다", () => {
    const payload = toTicketingPayload(form({ ticketingEnabled: true }))

    expect(payload.ticketingRounds[0].ticketingAt).toBe("2027-05-01T18:00:00")
  })

  it("티켓팅이 꺼져 있으면 회차를 보내지 않는다", () => {
    const payload = toTicketingPayload(form({ ticketingEnabled: false }))

    expect(payload.ticketingRounds).toEqual([])
  })

  it("시작일부터 종료일까지 하루씩 펼친다", () => {
    expect(buildFestivalDateRange("2027-05-14", "2027-05-16")).toEqual([
      "2027-05-14",
      "2027-05-15",
      "2027-05-16",
    ])
  })

  it("종료일이 시작일보다 빠르면 빈 목록을 준다", () => {
    expect(buildFestivalDateRange("2027-05-16", "2027-05-14")).toEqual([])
  })

  function form(overrides: Partial<FestivalSettingsForm>): FestivalSettingsForm {
    return {
      schoolName: "단국대학교",
      festivalName: "2027 DANFESTA",
      startDate: "2027-05-14",
      endDate: "2027-05-16",
      ticketingEnabled: true,
      ticketingRounds: [
        { key: "a", ticketingAt: "2027-05-01T18:00", capacity: 1500, performanceDate: "2027-05-15" },
      ],
      ...overrides,
    }
  }
})
