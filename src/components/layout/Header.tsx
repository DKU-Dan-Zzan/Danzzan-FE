// 역할: 앱 레이아웃 레이어의 Header 구성 컴포넌트를 제공합니다.
import { useLocation, useNavigate } from "react-router-dom"
import { Ticket } from "lucide-react"
import { useSyncExternalStore } from "react"
import { authStore } from "@/store/common/authStore"
import { getMyTicketNavigationTarget } from "@/lib/common/my-ticket-navigation"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { APP_HEADER_ROUND_BUTTON_BASE_CLASS } from "@/components/layout/AppHeaderRoundButtonClass"
import { cn } from "@/components/common/ui/utils"

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const session = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot,
  )
  const isLoggedIn = !!session.tokens?.accessToken && session.role === "student"
  const isBoothMapPage = location.pathname === "/map"

  const handleTicketClick = () => {
    navigate(getMyTicketNavigationTarget(isLoggedIn))
  }

  return (
    <AppTopBar
      headerClassName={
        isBoothMapPage
          ? "absolute inset-x-0 top-0 z-50 border-b border-[color:color-mix(in_srgb,var(--boothmap-panel-border)_32%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--boothmap-panel-bg)_80%,transparent)_0%,color-mix(in_srgb,var(--boothmap-panel-bg)_72%,transparent)_28%,color-mix(in_srgb,var(--boothmap-panel-bg)_60%,transparent)_100%)] backdrop-blur-xl pt-[env(safe-area-inset-top)]"
          : undefined
      }
    >
        <button
          onClick={handleTicketClick}
          aria-label={isLoggedIn ? "내 티켓 보기" : "로그인 후 내 티켓 보기"}
          title={isLoggedIn ? "내 티켓 보기" : "로그인 후 내 티켓 보기"}
          className={cn(APP_HEADER_ROUND_BUTTON_BASE_CLASS, "right-4")}
        >
          <Ticket size={20} className="text-[var(--app-header-ticket-btn-icon)]" />
        </button>
    </AppTopBar>
  )
}

export default Header
