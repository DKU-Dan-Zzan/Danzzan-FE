import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/ticketing/useAuth";
import { AdminLayout } from "@/components/ticketing/layout/AdminLayout";
import { UserLayout } from "@/components/ticketing/layout/UserLayout";
import Login from "@/routes/ticketing/Login/Login";
import ResetPassword from "@/routes/ticketing/reset-password/ResetPassword";
import Signup from "@/routes/ticketing/Signup/Signup";
import Ticketing from "@/routes/ticketing/Ticketing/Ticketing";
import MyTicket from "@/routes/ticketing/my-ticket/MyTicket";
import AdminLogin from "@/routes/ticketing/admin/login/AdminLogin";
import WristbandPage from "@/routes/ticketing/admin/wristband/WristbandPage";
import TokenRequired from "@/routes/ticketing/admin/token-required/TokenRequired";
import NotFoundPage from "@/routes/ticketing/not-found/NotFoundPage";
import {
  buildLoginRedirectPath,
  buildReturnTo,
  isRoleAuthenticated,
} from "@/routes/common/authGuard";
import { env } from "@/utils/ticketing/env";
import "@/routes/ticketing/index.css";

function RequireStudentAuth() {
  const { session } = useAuth();
  const location = useLocation();
  const returnTo = buildReturnTo(location.pathname, location.search);

  if (
    !isRoleAuthenticated({
      accessToken: session.tokens?.accessToken,
      role: session.role,
      requiredRole: "student",
    })
  ) {
    return <Navigate to={buildLoginRedirectPath("/ticket/login", returnTo)} replace />;
  }

  return <Outlet />;
}

function RequireAdminAuth() {
  const { session } = useAuth();
  const location = useLocation();
  const returnTo = buildReturnTo(location.pathname, location.search);

  if (env.apiMode === "mock") {
    return <Outlet />;
  }

  if (
    !isRoleAuthenticated({
      accessToken: session.tokens?.accessToken,
      role: session.role,
      requiredRole: "admin",
    })
  ) {
    return (
      <TokenRequired
        loginRedirectPath={buildLoginRedirectPath("/ticket/admin/login", returnTo)}
        returnTo={returnTo}
      />
    );
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
