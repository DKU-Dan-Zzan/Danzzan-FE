import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { useAdminAuth } from "@/hooks/app/admin/useAdminAuth";
import { buildLoginRedirectPath, buildReturnTo } from "@/routes/common/authGuard";

const AppLayout = lazy(() => import("./components/layout/AppLayout"));
const AdminLayout = lazy(() => import("./components/layout/AdminLayout"));
const Home = lazy(() => import("./routes/home/Home"));
const Notice = lazy(() => import("./routes/notice/Notice"));
const Timetable = lazy(() => import("./routes/timetable/Timetable"));
const BoothMap = lazy(() => import("./routes/boothmap/BoothMap"));
const MyPage = lazy(() => import("./routes/mypage/MyPage"));
const Admin = lazy(() => import("./routes/admin/Admin"));
const AdminLogin = lazy(() => import("./routes/admin/AdminLogin"));
const AdminMap = lazy(() => import("./routes/admin/AdminMap"));
const TicketingApp = lazy(() => import("./routes/ticketing/TicketingApp"));

function RouteLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-[var(--text-muted)]">
      화면 불러오는 중...
    </div>
  );
}

const withRouteSuspense = (node: ReactNode) => {
  return <Suspense fallback={<RouteLoading />}>{node}</Suspense>;
};

function ProtectedAdminRoute() {
  const { isAuthenticated, tryRestoreSession } = useAdminAuth();
  const location = useLocation();
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
    return (
      <Navigate
        to={buildLoginRedirectPath(
          "/admin/login",
          buildReturnTo(location.pathname, location.search),
        )}
        replace
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

function App() {
  return (
    <Routes>
      {/* 일반 사용자: 헤더/바텀네비 적용 */}
      <Route element={withRouteSuspense(<AppLayout />)}>
        <Route path="/" element={withRouteSuspense(<Home />)} />
        <Route path="/notice" element={withRouteSuspense(<Notice />)} />
        <Route path="/timetable" element={withRouteSuspense(<Timetable />)} />
        <Route path="/map" element={withRouteSuspense(<BoothMap />)} />
        <Route path="/mypage" element={withRouteSuspense(<MyPage />)} />
      </Route>

      {/* admin: 헤더/바텀네비 미적용 */}
      <Route path="/admin" element={withRouteSuspense(<AdminLayout />)}>
        {/* 로그인은 공개 */}
        <Route path="login" element={withRouteSuspense(<AdminLogin />)} />

        {/* 로그인 필요한 관리자 페이지들 */}
        <Route element={<ProtectedAdminRoute />}>
          <Route index element={withRouteSuspense(<Admin />)} />
          <Route path="map" element={withRouteSuspense(<AdminMap />)} />
        </Route>
      </Route>

      <Route path="/ticket/*" element={withRouteSuspense(<TicketingApp />)} />

      <Route path="/login" element={<Navigate to="/ticket/login" replace />} />
      <Route path="/signup" element={<Navigate to="/ticket/signup" replace />} />
      <Route path="/reset-password" element={<Navigate to="/ticket/reset-password" replace />} />
      <Route path="/ticketing" element={<Navigate to="/ticket/ticketing" replace />} />
      <Route path="/myticket" element={<LegacyMyTicketRedirect />} />
    </Routes>
  );
}

export default App;
