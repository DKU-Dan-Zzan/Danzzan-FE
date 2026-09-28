// 역할: 앱이 뜰 때 축제 설정을 한 번 받아와 운영 날짜 저장소에 넣는다.
//
// 실패해도 화면은 기본 날짜로 계속 동작한다. 축제 당일 설정 API 한 곳이 흔들려도
// 부스맵·타임테이블이 빈 화면이 되지 않게 하기 위해서다.
import { useEffect } from "react"

import { getFestivalSettings } from "@/api/app/festival/festivalSettingsApi"
import { setFestivalDates, setTicketingEnabled } from "@/lib/app/festival/festivalCalendar"

export function useLoadFestivalSettings(): void {
  useEffect(() => {
    const controller = new AbortController()

    getFestivalSettings({ signal: controller.signal })
      .then((settings) => {
        setFestivalDates(settings.operationDates)
        setTicketingEnabled(settings.ticketingEnabled)
      })
      .catch(() => {
        // 기본 날짜를 그대로 둔다.
      })

    return () => controller.abort()
  }, [])
}
