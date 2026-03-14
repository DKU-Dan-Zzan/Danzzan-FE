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
        bg-blue-600
        border-b border-blue-700/40
        pt-[env(safe-area-inset-top)]
      "
    >
      <div className="mx-auto flex h-16 max-w-[430px] items-center justify-between px-4">
        <div className="w-11" />

        <img
          src="/DAN-ZZAN.png"
          alt="DAN-ZZAN"
          className="h-[38px] w-[170px] object-cover object-center select-none"
          draggable={false}
        />

        <button
          onClick={handleTicketClick}
          aria-label={isLoggedIn ? "내 티켓 보기" : "로그인 후 내 티켓 보기"}
          title={isLoggedIn ? "내 티켓 보기" : "로그인 후 내 티켓 보기"}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-blue-600 shadow-md transition-all active:scale-95"
        >
          <Ticket size={20} />
        </button>
      </div>
    </header>
  )
}

export default Header
