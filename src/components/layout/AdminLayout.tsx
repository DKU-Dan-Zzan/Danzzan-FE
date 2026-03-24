// 역할: 앱 레이아웃 레이어의 Admin Layout 구성 컴포넌트를 제공합니다.
import { Outlet } from "react-router-dom"

const AdminLayout = () => {
  return (
    <div className="min-h-dvh">
      <Outlet />
    </div>
  )
}

export default AdminLayout
