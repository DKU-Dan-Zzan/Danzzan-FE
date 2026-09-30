// 역할: 서버 설정을 처음 진입/포커스 복귀/주기 갱신으로 사용자 화면에 반영한다.
import { useEffect } from "react"
import { getFestivalSettings } from "@/api/app/festival/festivalSettingsApi"
import { setFestivalDates, setTicketingEnabled, setTicketingBackgroundImageUrl } from "@/lib/app/festival/festivalCalendar"
export function useLoadFestivalSettings(): void {
  useEffect(() => {
    const controller = new AbortController()
    let pending = false
    const refresh = async () => {
      if (pending || document.visibilityState === "hidden") return
      pending = true
      try {
        const settings = await getFestivalSettings({ signal: controller.signal })
        if (controller.signal.aborted) return
        setFestivalDates(settings.operationDates)
        setTicketingEnabled(settings.ticketingEnabled)
        setTicketingBackgroundImageUrl(settings.ticketingBackgroundImageUrl ?? null)
      } catch { /* 네트워크 오류에는 마지막으로 받은 설정 유지 */ }
      finally { pending = false }
    }
    void refresh()
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", refresh)
    const timer = window.setInterval(refresh, 30_000)
    return () => {
      controller.abort()
      clearInterval(timer)
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [])
}
