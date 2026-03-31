// 역할: 앱 레이아웃 레이어의 App Layout 구성 컴포넌트를 제공합니다.
import { Outlet, useLocation } from "react-router-dom"
import Header from "./Header"
import BottomNav from "./BottomNav"
import Footer from "./Footer"
import { AppShell } from "./AppShell"

const Layout = () => {
  const location = useLocation()
  const hideFooter = location.pathname === "/map"
  const isBoothMapPage = location.pathname === "/map"
  const isTimetablePage = location.pathname === "/timetable"
  const timetableBorderOverrideClass = isTimetablePage
    ? "[--border-base:var(--home-card-border)] [--border-subtle:var(--home-card-border)] [--timetable-card-border:var(--home-card-border)] [--timetable-info-border:var(--home-card-border)] [--timetable-active-line:var(--home-card-border)] [--app-header-border:var(--home-card-border)] [--app-nav-border:var(--home-card-border)] [--app-circle-border:var(--home-card-border)] [--app-header-ticket-btn-border:var(--home-card-border)]"
    : ""
  const rootClassName = isBoothMapPage
    ? `h-dvh overflow-hidden bg-white ${timetableBorderOverrideClass}`
    : `min-h-dvh bg-[var(--bg-page-soft)] ${timetableBorderOverrideClass}`
  const frameClassName = isBoothMapPage
    ? "relative mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden pb-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))]"
    : "mx-auto flex min-h-dvh max-w-[430px] flex-col bg-[var(--bg-page-soft)] pb-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))]"

  return (
    <AppShell
      colorScheme="webapp"
      header={<Header />}
      footer={!hideFooter ? <Footer /> : undefined}
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
