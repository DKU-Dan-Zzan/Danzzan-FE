// 역할: 앱 레이아웃 레이어의 App Layout 구성 컴포넌트를 제공합니다.
import { Outlet, useLocation } from "react-router-dom"
import { useSyncExternalStore } from "react"
import Header from "./Header"
import BottomNav from "./BottomNav"
import Footer from "./Footer"
import { AppShell } from "./AppShell"
import { authStore } from "@/store/common/authStore"

const Layout = () => {
  const location = useLocation()
  const session = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot,
  )
  const isMyPage = location.pathname.startsWith("/mypage")
  const isMyPageGuest = isMyPage && !(session.tokens?.accessToken && session.role === "student")
  const shouldShowFooter = isMyPage && !isMyPageGuest
  const isBoothMapPage = location.pathname === "/map"
  const rootClassName = isBoothMapPage
    ? "h-dvh overflow-hidden bg-[var(--bg-page-soft)]"
    : "min-h-dvh bg-[var(--bg-page-soft)] [background-image:var(--app-overscroll-bg-gradient)] bg-no-repeat bg-[length:100%_100%]"
  const frameClassName = isBoothMapPage
    ? "relative mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden pb-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))]"
    : isMyPageGuest
      ? "mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-[var(--bg-page-soft)]"
      : "mx-auto flex min-h-dvh max-w-[430px] flex-col bg-[var(--bg-page-soft)] pb-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))]"

  return (
    <AppShell
      colorScheme="electric-curator"
      header={<Header />}
      footer={shouldShowFooter ? <Footer /> : undefined}
      bottomNav={<BottomNav />}
      rootClassName={rootClassName}
      frameClassName={frameClassName}
      mainClassName={
        isBoothMapPage
          ? "flex-1 overflow-hidden"
          : "flex-1 overflow-x-hidden [&>*]:min-h-full"
      }
    >
      <Outlet />
    </AppShell>
  )
}

export default Layout
