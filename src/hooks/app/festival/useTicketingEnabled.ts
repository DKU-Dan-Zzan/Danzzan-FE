// 역할: 축제 설정의 티켓팅 사용 여부를 화면에서 구독한다.
import { useSyncExternalStore } from "react"

import {
  getTicketingEnabled,
  subscribeFestivalSettings,
} from "@/lib/app/festival/festivalCalendar"

export function useTicketingEnabled(): boolean {
  return useSyncExternalStore(subscribeFestivalSettings, getTicketingEnabled, getTicketingEnabled)
}
