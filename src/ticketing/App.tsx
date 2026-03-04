import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/ticketing/hooks/useAuth";
import { AdminLayout } from "@/ticketing/components/layout/AdminLayout";
import { UserLayout } from "@/ticketing/components/layout/UserLayout";
import Login from "@/ticketing/routes/Login/Login";
import Signup from "@/ticketing/routes/Signup/Signup";
import Ticketing from "@/ticketing/routes/Ticketing/Ticketing";
import MyTicket from "@/ticketing/routes/MyTicket/MyTicket";
import AdminLogin from "@/ticketing/routes/admin/Login/AdminLogin";
import WristbandPage from "@/ticketing/routes/admin/Wristband/WristbandPage";
import TokenRequired from "@/ticketing/routes/admin/TokenRequired/TokenRequired";
import NotFoundPage from "@/ticketing/routes/NotFound/NotFoundPage";
import { env } from "@/ticketing/utils/env";

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<UserLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<RequireStudentAuth />}>
            <Route path="/ticketing" element={<Ticketing />} />
            <Route path="/myticket" element={<MyTicket />} />
          </Route>
        </Route>

        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={<RequireAdminAuth />}>
          <Route element={<AdminLayout />}>
            <Route path="wristband" element={<WristbandPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
