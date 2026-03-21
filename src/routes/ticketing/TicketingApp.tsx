import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/ticketing/useAuth";
import {
  buildLoginRedirectPath,
  buildReturnTo,
  isRoleAuthenticated,
} from "@/routes/common/authGuard";
import { env } from "@/utils/ticketing/env";

const AdminLayout = lazy(() =>
  import("@/components/ticketing/layout/AdminLayout").then((module) => ({
    default: module.AdminLayout,
  })),
);
const UserLayout = lazy(() =>
  import("@/components/ticketing/layout/UserLayout").then((module) => ({
    default: module.UserLayout,
  })),
);
const Login = lazy(() => import("@/routes/ticketing/login/Login"));
const ResetPassword = lazy(() => import("@/routes/ticketing/reset-password/ResetPassword"));
const Signup = lazy(() => import("@/routes/ticketing/signup/Signup"));
const Ticketing = lazy(() => import("@/routes/ticketing/ticketing/Ticketing"));
const MyTicket = lazy(() => import("@/routes/ticketing/my-ticket/MyTicket"));
const AdminLogin = lazy(() => import("@/routes/ticketing/admin/login/AdminLogin"));
const WristbandPage = lazy(() => import("@/routes/ticketing/admin/wristband/WristbandPage"));
const TokenRequired = lazy(() => import("@/routes/ticketing/admin/token-required/TokenRequired"));
const NotFoundPage = lazy(() => import("@/routes/ticketing/not-found/NotFoundPage"));

function TicketingRouteLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-[var(--text-muted)]">
      화면 불러오는 중...
    </div>
  );
}

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

function LegacyMyTicketRedirect() {
  const location = useLocation();

  return (
    <Navigate
      to={{
        pathname: "/ticket/my-ticket",
        search: location.search,
      }}
      replace
    />
  );
}

export default function TicketingApp() {
  return (
    <div className="ticketing-root">
      <Suspense fallback={<TicketingRouteLoading />}>
        <Routes>
          <Route index element={<Navigate to="login" replace />} />

          <Route element={<UserLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="signup" element={<Signup />} />
            <Route element={<RequireStudentAuth />}>
              <Route path="ticketing" element={<Ticketing />} />
              <Route path="my-ticket" element={<MyTicket />} />
              <Route path="myticket" element={<LegacyMyTicketRedirect />} />
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
      </Suspense>
    </div>
  );
}
