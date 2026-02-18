import { Outlet } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import BottomNav from "./BottomNav"

const Layout = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[430px] mx-auto flex flex-col min-h-full">
        <Header />

        {/* Footer가 BottomNav에 가리지 않도록: BottomNav 높이만큼 padding-bottom */}
        <main className="flex-1 pb-[calc(84px+env(safe-area-inset-bottom))]">
          <Outlet />
          <Footer />
        </main>

        <BottomNav />
      </div>
    </div>
  )
}

export default Layout
