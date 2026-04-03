// 역할: 앱 레이아웃 레이어의 App Layout 구성 컴포넌트를 제공합니다.
import { Outlet, useLocation } from "react-router-dom"
import Header from "./Header"
import BottomNav from "./BottomNav"
import Footer from "./Footer"
import { AppShell } from "./AppShell"

const Layout = () => {
  const location = useLocation()
  const shouldShowFooter = location.pathname.startsWith("/mypage")
  const isBoothMapPage = location.pathname === "/map"
  const boothMapHeaderOverrideClass = isBoothMapPage
    ? "[--app-header-border:color-mix(in_srgb,var(--boothmap-panel-border)_20%,transparent)] [--app-header-bg:color-mix(in_srgb,var(--boothmap-panel-bg)_0%,transparent)] [--app-header-bg-gradient:linear-gradient(180deg,color-mix(in_srgb,var(--boothmap-panel-bg)_60%,transparent)_0%,color-mix(in_srgb,var(--boothmap-panel-bg)_46%,transparent)_42%,color-mix(in_srgb,var(--boothmap-panel-bg)_30%,transparent)_100%)]"
    : ""
  const rootClassName = isBoothMapPage
    ? `h-dvh overflow-hidden bg-[var(--bg-page-soft)] ${boothMapHeaderOverrideClass}`
    : "min-h-dvh bg-[var(--bg-page-soft)] [background-image:var(--app-overscroll-bg-gradient)] bg-no-repeat bg-[length:100%_100%]"
  const frameClassName = isBoothMapPage
    ? "relative mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden pb-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))]"
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
