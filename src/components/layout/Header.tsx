// 역할: 앱 레이아웃 레이어의 Header 구성 컴포넌트를 제공합니다.
import { useNavigate } from "react-router-dom"
import { Ticket } from "lucide-react"
import { useSyncExternalStore } from "react"
import { authStore } from "@/store/common/authStore"
import { getMyTicketNavigationTarget } from "@/lib/common/my-ticket-navigation"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { APP_HEADER_ROUND_BUTTON_BASE_CLASS } from "@/components/layout/appHeaderRoundButtonClass"

const Header = () => {
  const navigate = useNavigate()
  const session = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot,
  )
  const isLoggedIn = !!session.tokens?.accessToken && session.role === "student"

  const handleTicketClick = () => {
    navigate(getMyTicketNavigationTarget(isLoggedIn))
  }

  return (
    <AppTopBar>
        <button
          onClick={handleTicketClick}
          aria-label={isLoggedIn ? "내 티켓 보기" : "로그인 후 내 티켓 보기"}
          title={isLoggedIn ? "내 티켓 보기" : "로그인 후 내 티켓 보기"}
          className={`${APP_HEADER_ROUND_BUTTON_BASE_CLASS} right-4`}
        >
          <Ticket size={20} className="text-[var(--app-header-ticket-btn-icon)]" />
        </button>
    </AppTopBar>
  )
}

export default Header
