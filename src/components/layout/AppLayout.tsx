import type { CSSProperties } from "react"
import { Outlet } from "react-router-dom"
import Header from "./Header"
import BottomNav from "./BottomNav"
import Footer from "./Footer"

const layoutStyle = {
  "--app-bottom-nav-height": "84px",
} as CSSProperties;

const Layout = () => {
  return (
    <div className="min-h-dvh bg-white" style={layoutStyle}>
      <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col pb-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))]">
        <Header />

        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>

        <Footer />
        <BottomNav />
      </div>
    </div>
  )
}

export default Layout
