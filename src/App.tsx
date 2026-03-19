import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import AdminLayout from './components/layout/AdminLayout'

import Home from './routes/home/Home'
import Notice from './routes/notice/Notice'
import Timetable from './routes/timetable/Timetable'
import BoothMap from "./routes/boothmap/BoothMap";
import MyPage from "./routes/mypage/MyPage";

import Admin from "./routes/admin/Admin";
import AdminLogin from "./routes/admin/AdminLogin";
import { useAdminAuth } from "./hooks/useAdminAuth";
import { useEffect, useState } from "react";
import TicketingApp from "./routes/ticketing/TicketingApp";

function ProtectedAdmin() {
  const { isAuthenticated, tryRestoreSession } = useAdminAuth();
  const [restoreDone, setRestoreDone] = useState(false);

  useEffect(() => {
    if (restoreDone) return;
    tryRestoreSession().then(() => setRestoreDone(true));
  }, [restoreDone, tryRestoreSession]);

  if (!restoreDone) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-[var(--text-muted)]">
        세션 확인 중...
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Admin />;
}

function App() {
  return (
    <Routes>
      {/* 일반 사용자: 헤더/바텀네비 적용 */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/notice" element={<Notice />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/map" element={<BoothMap />} />
        <Route path="/mypage" element={<MyPage />} />
      </Route>

      {/* admin: 헤더/바텀네비 미적용, 로그인 필요 */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<ProtectedAdmin />} />
        <Route path="login" element={<AdminLogin />} />
      </Route>

      <Route path="/ticket/*" element={<TicketingApp />} />

      <Route path="/login" element={<Navigate to="/ticket/login" replace />} />
      <Route path="/signup" element={<Navigate to="/ticket/signup" replace />} />
      <Route path="/reset-password" element={<Navigate to="/ticket/reset-password" replace />} />
      <Route path="/ticketing" element={<Navigate to="/ticket/ticketing" replace />} />
      <Route path="/myticket" element={<Navigate to="/ticket/myticket" replace />} />
    </Routes>
  )
}

export default App
