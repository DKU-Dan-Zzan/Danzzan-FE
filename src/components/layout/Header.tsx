import { useNavigate } from "react-router-dom"
import { Ticket } from "lucide-react"
import { useSyncExternalStore } from "react"
import { authStore } from "@/store/ticketing/authStore"

const Header = () => {
  const navigate = useNavigate()
  const session = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot,
  )
  const isLoggedIn = !!session.tokens?.accessToken && session.role === "student"

  const handleTicketClick = () => {
    if (isLoggedIn) {
      navigate("/ticket/myticket")
    }
  }

  return (
    <header
      className="
        sticky top-0 z-50
        bg-white/85 backdrop-blur-xl
        border-b border-slate-200/70
        pt-[env(safe-area-inset-top)]
      "
    >
      <div className="max-w-[430px] mx-auto h-14 flex items-center justify-between px-4">
        <div className="w-10" />

        <img
          src="/DAN-ZZAN.png"
          alt="DAN-ZZAN"
          className="h-11 object-contain select-none"
          draggable={false}
        />

        <button
          onClick={handleTicketClick}
          disabled={!isLoggedIn}
          title={isLoggedIn ? "내 티켓 보기" : "로그인 후 이용 가능"}
          className={`
            flex h-10 w-10 items-center justify-center rounded-full transition-all
            ${isLoggedIn
              ? "bg-blue-600 text-white shadow-md active:scale-95"
              : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }
          `}
        >
          <Ticket size={20} />
        </button>
      </div>
    </header>
  )
}

export default Header
