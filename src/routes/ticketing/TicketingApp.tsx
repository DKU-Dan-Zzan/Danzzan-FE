import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/ticketing/useAuth";
import { AdminLayout } from "@/components/ticketing/layout/AdminLayout";
import { UserLayout } from "@/components/ticketing/layout/UserLayout";
import Login from "@/routes/ticketing/Login/Login";
import ResetPassword from "@/routes/ticketing/ResetPassword/ResetPassword";
import Signup from "@/routes/ticketing/Signup/Signup";
import Ticketing from "@/routes/ticketing/Ticketing/Ticketing";
import MyTicket from "@/routes/ticketing/MyTicket/MyTicket";
import AdminLogin from "@/routes/ticketing/admin/Login/AdminLogin";
import WristbandPage from "@/routes/ticketing/admin/Wristband/WristbandPage";
import TokenRequired from "@/routes/ticketing/admin/TokenRequired/TokenRequired";
import NotFoundPage from "@/routes/ticketing/NotFound/NotFoundPage";
import { env } from "@/utils/ticketing/env";
import "@/routes/ticketing/index.css";

function RequireStudentAuth() {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || role !== "student") {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/ticket/login?redirect=${redirect}`} replace />;
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

export default function TicketingApp() {
  return (
    <div className="ticketing-root">
      <Routes>
        <Route index element={<Navigate to="login" replace />} />

        <Route element={<UserLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="signup" element={<Signup />} />
          <Route element={<RequireStudentAuth />}>
            <Route path="ticketing" element={<Ticketing />} />
            <Route path="myticket" element={<MyTicket />} />
          </Route>
        </Route>

        <Route path="admin" element={<AdminLogin />} />
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin/*" element={<RequireAdminAuth />}>
          <Route element={<AdminLayout />}>
            <Route path="wristband" element={<WristbandPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}
