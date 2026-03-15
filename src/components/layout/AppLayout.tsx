import { Outlet, useLocation } from "react-router-dom"
import Header from "./Header"
import BottomNav from "./BottomNav"
import Footer from "./Footer"

const Layout = () => {
  const location = useLocation()
  const hideFooter = location.pathname === "/map"
  const isBoothMapPage = location.pathname === "/map"

  return (
    <div
      className={isBoothMapPage ? "h-dvh overflow-hidden bg-white" : "min-h-dvh bg-white"}
    >
      <div
        className={
          isBoothMapPage
            ? "mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden pb-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))]"
            : "mx-auto flex min-h-dvh max-w-[430px] flex-col pb-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))]"
        }
      >
        <Header />

        <main className={isBoothMapPage ? "flex-1 overflow-hidden" : "flex-1 overflow-x-hidden"}>
          <Outlet />
        </main>

        {!hideFooter && <Footer />}
        <BottomNav />
      </div>
    </div>
  )
}

export default Layout
