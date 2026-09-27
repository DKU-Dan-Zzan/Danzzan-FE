// 역할: 앱 레이아웃 레이어의 Admin Layout 구성 컴포넌트를 제공합니다.
import { Outlet, useLocation } from "react-router-dom"

import AdminTopNav from "@/components/layout/AdminTopNav"

const AdminLayout = () => {
  const location = useLocation()
  // 로그인 화면에는 메뉴를 띄우지 않는다.
  const showTopNav = !location.pathname.startsWith("/admin/login")

  return (
    <div className="min-h-dvh bg-[var(--bg-base)]">
      {showTopNav && <AdminTopNav />}
      <Outlet />
    </div>
  )
}

export default AdminLayout
