import { useNavigate } from "react-router-dom"
import { Ticket } from "lucide-react"
import { useSyncExternalStore } from "react"
import { authStore } from "@/store/ticketing/authStore"
import { getMyTicketNavigationTarget } from "@/routes/ticketing/authNavigation"

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
    <header
      className="
        sticky top-0 z-50
        bg-[var(--app-header-bg)]
        border-b border-[var(--app-header-border)]
        pt-[env(safe-area-inset-top)]
      "
    >
      <div className="relative mx-auto h-16 max-w-[430px] px-4">
        <img
          src="/DAN-ZZAN.png"
          alt="DAN-ZZAN"
          className="pointer-events-none absolute top-[75%] left-1/2 h-[68px] w-[300px] -translate-x-1/2 -translate-y-1/2 object-cover object-[50%_58%] select-none brightness-0 invert"
          draggable={false}
        />

        <button
          onClick={handleTicketClick}
          aria-label={isLoggedIn ? "내 티켓 보기" : "로그인 후 내 티켓 보기"}
          title={isLoggedIn ? "내 티켓 보기" : "로그인 후 내 티켓 보기"}
          className="app-header-ticket-button absolute top-1/2 right-4 -translate-y-1/2"
        >
          <Ticket size={20} className="app-header-ticket-icon" />
        </button>
      </div>
    </header>
  )
}

export default Header
