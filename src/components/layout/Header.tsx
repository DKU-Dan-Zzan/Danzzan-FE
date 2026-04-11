// 역할: 앱 레이아웃 레이어의 Header 구성 컴포넌트를 제공합니다.
import { useLocation, useNavigate } from "react-router-dom"
import { Ticket, User } from "lucide-react"
import { useSyncExternalStore } from "react"
import { authStore } from "@/store/common/authStore"
import { getMyTicketNavigationTarget } from "@/lib/common/my-ticket-navigation"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { cn } from "@/components/common/ui/utils"

const HEADER_ICON_BUTTON_CLASS =
  "absolute top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center text-[color:color-mix(in_srgb,var(--text)_96%,black)] transition-colors duration-150 hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isMyPage = location.pathname === "/mypage"
  const session = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot,
  )
  const isLoggedIn = !!session.tokens?.accessToken && session.role === "student"
  const isTimetablePage = location.pathname === "/timetable"
  const isBoothMapPage = location.pathname === "/map"
  const isNoticePage = location.pathname === "/notice"

  const handleTicketClick = () => {
    navigate(getMyTicketNavigationTarget(isLoggedIn))
  }

  const handleMyInfoClick = () => {
    navigate("/mypage")
  }

  const headerClassName =
    isBoothMapPage
      ? "fixed inset-x-0 top-0 z-50 bg-transparent shadow-none pt-[env(safe-area-inset-top)]"
      : isNoticePage || isMyPage || isTimetablePage
        ? "fixed inset-x-0 top-0 z-50 bg-transparent shadow-none pt-[env(safe-area-inset-top)]"
        : "fixed inset-x-0 top-0 z-50 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_56%,transparent)_0%,color-mix(in_srgb,var(--surface)_44%,transparent)_16%,color-mix(in_srgb,var(--surface)_32%,transparent)_34%,color-mix(in_srgb,var(--surface)_22%,transparent)_52%,color-mix(in_srgb,var(--surface)_12%,transparent)_70%,color-mix(in_srgb,var(--surface)_5%,transparent)_86%,color-mix(in_srgb,var(--surface)_0%,transparent)_100%)] shadow-none pt-[env(safe-area-inset-top)]"

  return (
    <>
      {(isNoticePage || isMyPage || isTimetablePage) && (
        <div
          aria-hidden
          className="pointer-events-none fixed left-1/2 top-0 z-[45] h-[calc(68px+env(safe-area-inset-top))] w-full max-w-[430px] -translate-x-1/2 bg-[color-mix(in_srgb,var(--surface)_78%,transparent)] shadow-[inset_0_-1px_0_color-mix(in_srgb,var(--border-base)_35%,transparent)] backdrop-blur-md"
        />
      )}
      <AppTopBar headerClassName={headerClassName}>
        {!isMyPage && (
          <>
            <button
              onClick={handleTicketClick}
              aria-label={isLoggedIn ? "내 티켓 보기" : "로그인 후 내 티켓 보기"}
              title={isLoggedIn ? "내 티켓 보기" : "로그인 후 내 티켓 보기"}
              className={cn(HEADER_ICON_BUTTON_CLASS, "right-[4.25rem]")}
            >
              <Ticket size={22} />
            </button>
            <button
              onClick={handleMyInfoClick}
              aria-label="내정보"
              title="내정보"
              className={cn(HEADER_ICON_BUTTON_CLASS, "right-4")}
            >
              <User size={22} />
            </button>
          </>
        )}
      </AppTopBar>
    </>
  )
}

export default Header
