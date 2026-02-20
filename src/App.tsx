import { type ReactNode } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminSystem } from "@/hooks/useAdminSystem";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { UserLayout } from "@/components/layout/UserLayout";
import Login from "@/routes/Login/Login";
import Signup from "@/routes/Signup/Signup";
import Ticketing from "@/routes/Ticketing/Ticketing";
import MyTicket from "@/routes/MyTicket/MyTicket";
import AdminLogin from "@/routes/admin/Login/AdminLogin";
import AdminDashboard from "@/routes/admin/Dashboard/Dashboard";
import WristbandPage from "@/routes/admin/Wristband/WristbandPage";
import NoticeAdminPage from "@/routes/admin/Board/NoticeAdminPage";
import LostFoundAdminPage from "@/routes/admin/Board/LostFoundAdminPage";
import TokenRequired from "@/routes/admin/TokenRequired/TokenRequired";
import NotFoundPage from "@/routes/NotFound/NotFoundPage";
import { env } from "@/utils/env";
import type { AdminSystem } from "@/store/adminSystemStore";

function RequireStudentAuth() {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || role !== "student") {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}

function RequireAdminAuth() {
  const { isAuthenticated, role } = useAuth();

  if (env.apiMode === "mock") {
    return <Outlet />;
  }

  if (!isAuthenticated || role !== "admin") {
    return <TokenRequired />;
  }

  return <Outlet />;
}

function RequireAdminSystem({
  allow,
  children,
}: {
  allow: AdminSystem;
  children: ReactNode;
}) {
  const system = useAdminSystem();

  if (!system) {
    return <Navigate to="/admin" replace />;
  }

  if (system !== allow) {
    return (
      <Navigate to={system === "board" ? "/admin/board" : "/admin/wristband"} replace />
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />

        <Route element={<UserLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<RequireStudentAuth />}>
            {/* <Route path="/ticketing" element={<Ticketing />} /> */}
            {/* <Route path="/myticket" element={<MyTicket />} /> */}
          </Route>
        </Route>

        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={<RequireAdminAuth />}>
          <Route element={<AdminLayout />}>
            <Route
              path="wristband"
              element={
                <RequireAdminSystem allow="wristband">
                  <WristbandPage />
                </RequireAdminSystem>
              }
            />
            <Route
              path="board"
              element={
                <RequireAdminSystem allow="board">
                  <NoticeAdminPage />
                </RequireAdminSystem>
              }
            />
            <Route
              path="board/lostfound"
              element={
                <RequireAdminSystem allow="board">
                  <LostFoundAdminPage />
                </RequireAdminSystem>
              }
            />
            <Route path="dashboard" element={<AdminDashboard />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
