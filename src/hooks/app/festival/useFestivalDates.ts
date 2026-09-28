// 역할: 축제 운영 날짜를 화면에서 구독해 쓰기 위한 훅. 서버 값이 갱신되면 화면도 따라 바뀐다.
import { useMemo, useSyncExternalStore } from "react"

import {
  getFestivalDates,
  subscribeFestivalSettings,
  toFestivalDateOptions,
  toFestivalDays,
} from "@/lib/app/festival/festivalCalendar"

export function useFestivalDates() {
  const dates = useSyncExternalStore(subscribeFestivalSettings, getFestivalDates, getFestivalDates)

  return useMemo(
    () => ({
      dates,
      defaultDate: dates[0] ?? "",
      dateOptions: toFestivalDateOptions(dates),
      days: toFestivalDays(dates),
    }),
    [dates],
  )
}
