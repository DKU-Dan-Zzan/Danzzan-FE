// 역할: 앱 레이아웃 레이어의 Header 구성 컴포넌트를 제공합니다.
import { useLocation, useNavigate } from "react-router-dom"
import { Ticket, User } from "lucide-react"
import { useSyncExternalStore } from "react"
import { authStore } from "@/store/common/authStore"
import { AppTopBar } from "@/components/layout/AppTopBar"
import LanguageToggle from "@/components/layout/LanguageToggle"
import { cn } from "@/components/common/ui/utils"
import { useT } from "@/i18n"

const TRANSPARENT_HEADER_CLASS =
  "fixed inset-x-0 top-0 z-50 bg-transparent shadow-none pt-[env(safe-area-inset-top)]"

/** 배경이 밝은 화면에서 헤더 아이콘 대비를 확보하는 흰 막. */
const SCRIM_HEADER_CLASS =
  "fixed inset-x-0 top-0 z-50 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_56%,transparent)_0%,color-mix(in_srgb,var(--surface)_44%,transparent)_16%,color-mix(in_srgb,var(--surface)_32%,transparent)_34%,color-mix(in_srgb,var(--surface)_22%,transparent)_52%,color-mix(in_srgb,var(--surface)_12%,transparent)_70%,color-mix(in_srgb,var(--surface)_5%,transparent)_86%,color-mix(in_srgb,var(--surface)_0%,transparent)_100%)] shadow-none pt-[env(safe-area-inset-top)]"

const HEADER_ICON_BUTTON_CLASS =
  "absolute top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"

/**
 * 언어 토글의 활성 알약과 같은 브랜드 주황을 쓴다. 주황은 어두운 포스터
 * (홈)와 흰 배경(공지·타임테이블) 양쪽에서 모두 읽히므로 화면별로 색을
 * 나눌 필요가 없다. 값을 박지 않고 토큰을 참조해 토글과 함께 움직인다.
 */
const HEADER_ICON_TONE_CLASS =
  "text-[var(--brand-main)] hover:brightness-110"

const Header = () => {
  const t = useT()
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
  const isHomePage = location.pathname === "/"
  const isMyPageGuest = isMyPage && !isLoggedIn
  const isMyPageAuthenticated = isMyPage && isLoggedIn

  const handleTicketClick = () => {
    navigate("/ticketing")
  }

  const handleMyInfoClick = () => {
    navigate("/mypage")
  }

  /**
   * 홈은 배경이 가을 축제 포스터라 어둡다. 흰 막을 깔면 포스터 위에 뿌연
   * 띠가 남아 아이덴티티를 해쳐서, 투명하게 두고 포스터를 그대로 보인다.
   */
  const headerClassName =
    isBoothMapPage ||
    isNoticePage ||
    isTimetablePage ||
    isMyPageAuthenticated ||
    isHomePage
      ? TRANSPARENT_HEADER_CLASS
      : SCRIM_HEADER_CLASS

  return (
    <>
      {(isNoticePage || (isMyPage && !isMyPageGuest) || isTimetablePage) && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none fixed left-1/2 top-0 z-[45] h-[calc(68px+env(safe-area-inset-top))] w-full max-w-[430px] -translate-x-1/2 backdrop-blur-md",
            isTimetablePage
              ? "bg-white/85"
              : "bg-[color-mix(in_srgb,var(--surface)_78%,transparent)] shadow-[inset_0_-1px_0_color-mix(in_srgb,var(--border-base)_35%,transparent)]",
          )}
        />
      )}
      <AppTopBar headerClassName={headerClassName}>
        {!isMyPage && (
          <>
            <LanguageToggle />
            <button
              onClick={handleTicketClick}
              aria-label={isLoggedIn ? t("common.headerMyTicketAria") : t("common.headerMyTicketSignInAria")}
              title={isLoggedIn ? t("common.headerMyTicketAria") : t("common.headerMyTicketSignInAria")}
              className={cn(HEADER_ICON_BUTTON_CLASS, HEADER_ICON_TONE_CLASS, "right-[4.25rem]")}
            >
              <Ticket size={22} />
            </button>
            <button
              onClick={handleMyInfoClick}
              aria-label={t("common.headerMyInfoAria")}
              title={t("common.headerMyInfoAria")}
              className={cn(HEADER_ICON_BUTTON_CLASS, HEADER_ICON_TONE_CLASS, "right-4")}
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
