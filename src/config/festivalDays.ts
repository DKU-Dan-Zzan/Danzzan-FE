// 역할: 축제 Day(1/2)와 실제 날짜의 매핑 상수를 사용자/관리자 화면이 함께 사용한다.

import type { FestivalDay } from "@/types/app/timetable/timetable.types"

export const FESTIVAL_DAYS: FestivalDay[] = [
  { key: "DAY-1", label: "1일차", date: "2026-09-09" },
  { key: "DAY-2", label: "2일차", date: "2026-09-10" },
]

export const findFestivalDayByDate = (date: string): FestivalDay | undefined => {
  return FESTIVAL_DAYS.find((day) => day.date === date)
}

export const findFestivalDayByKey = (key: FestivalDay["key"]): FestivalDay | undefined => {
  return FESTIVAL_DAYS.find((day) => day.key === key)
}
