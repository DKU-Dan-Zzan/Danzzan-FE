import { useNavigate } from "react-router-dom"
import { Ticket } from "lucide-react"
import { useSyncExternalStore } from "react"
import { authStore } from "@/store/common/authStore"
import { getMyTicketNavigationTarget } from "@/lib/common/my-ticket-navigation"
import { AppTopBar } from "@/components/layout/AppTopBar"

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
          className="absolute top-1/2 right-4 flex h-[var(--app-header-ticket-btn-size)] w-[var(--app-header-ticket-btn-size)] -translate-y-1/2 items-center justify-center rounded-full border border-[var(--app-header-ticket-btn-border)] bg-[linear-gradient(145deg,var(--app-header-ticket-btn-bg-start)_0%,var(--app-header-ticket-btn-bg-end)_100%)] shadow-[var(--app-header-ticket-btn-shadow)] backdrop-blur-[6px] transition-[transform,box-shadow,filter] duration-[180ms] hover:shadow-[var(--app-header-ticket-btn-shadow-hover)] hover:brightness-[1.01] active:scale-[0.96]"
        >
          <Ticket size={20} className="text-[var(--app-header-ticket-btn-icon)]" />
        </button>
    </AppTopBar>
  )
}

export default Header
