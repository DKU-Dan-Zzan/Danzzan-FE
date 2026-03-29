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

  return (
    <AppShell
      colorScheme="webapp"
      header={<Header />}
      footer={!hideFooter ? <Footer /> : undefined}
      bottomNav={<BottomNav />}
      rootClassName={isBoothMapPage ? "h-dvh overflow-hidden bg-white" : "min-h-dvh bg-[var(--bg-page-soft)]"}
      frameClassName={
        isBoothMapPage
          ? "mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden pb-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))]"
          : "mx-auto flex min-h-dvh max-w-[430px] flex-col bg-[var(--bg-page-soft)] pb-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))]"
      }
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
