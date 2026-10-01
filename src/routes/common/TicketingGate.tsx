// 역할: 티켓팅 화면을 축제 설정의 티켓팅 사용 여부로 잠근다.
//
// 관리자 설정에서 티켓팅을 끄면 예매와 내 티켓 화면이 안내 화면으로 바뀐다.
// 내 정보/로그인/회원가입은 티켓팅과 무관하게 항상 열려 있다.
import { useSyncExternalStore } from "react"
import { getTicketingBackgroundImageUrl, subscribeFestivalSettings } from "@/lib/app/festival/festivalCalendar"
import { Outlet } from "react-router-dom"

import ServiceClosedNotice from "@/routes/common/ServiceClosedNotice"
import { useTicketingEnabled } from "@/hooks/app/festival/useTicketingEnabled"

export default function TicketingGate() {
  const ticketingEnabled = useTicketingEnabled()
  const backgroundImageUrl = useSyncExternalStore(subscribeFestivalSettings, getTicketingBackgroundImageUrl, getTicketingBackgroundImageUrl)

  if (!ticketingEnabled) {
    return (
      <ServiceClosedNotice
        backgroundImageUrl={backgroundImageUrl}
        titleKey="closed.ticketing.title"
        descriptionKey="closed.ticketing.description"
        actionKey="closed.ticketing.action"
        actionTo="/"
      />
    )
  }

  return <Outlet />
}
