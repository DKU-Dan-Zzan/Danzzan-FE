// 역할: 축제 Day(1일차/2일차...)와 실제 날짜의 매핑. 실제 값은 서버 설정에서 온다.
//
// 화면에서는 useFestivalDates().days 를 쓴다. 아래 함수들은 훅 밖에서 날짜를 찾아야
// 하는 경우를 위한 것이다.

import { getFestivalDates, toFestivalDays } from "@/lib/app/festival/festivalCalendar"
import type { FestivalDay } from "@/types/app/timetable/timetable.types"

export const getFestivalDays = (): FestivalDay[] => toFestivalDays(getFestivalDates())

export const findFestivalDayByDate = (date: string): FestivalDay | undefined => {
  return getFestivalDays().find((day) => day.date === date)
}

export const findFestivalDayByKey = (key: FestivalDay["key"]): FestivalDay | undefined => {
  return getFestivalDays().find((day) => day.key === key)
}
