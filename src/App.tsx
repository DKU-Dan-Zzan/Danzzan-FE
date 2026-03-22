import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import {
  lazy,
  Suspense,
  useEffect,
  useState,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from "react";
import { useAdminAuth } from "@/hooks/app/admin/useAdminAuth";
import DelayedSpinner from "@/components/common/loading/DelayedSpinner";
import {
  preloadBottomNavLazyRoutes,
  registerRoutePreloader,
} from "@/lib/navigation/routePreload";
import { markBottomNavTransitionComplete } from "@/lib/perf/navTiming";
import { prefetchBottomNavTabData } from "@/lib/query/prefetchTabData";
import { buildLoginRedirectPath, buildReturnTo } from "@/routes/common/authGuard";
import AppLayout from "./components/layout/AppLayout";
import Home from "./routes/home/Home";
import Timetable from "./routes/timetable/Timetable";
import TicketingApp from "./routes/ticketing/TicketingApp";

type LazyWithPreload<T extends ComponentType<unknown>> = LazyExoticComponent<T> & {
  preload: () => Promise<{ default: T }>;
};

const lazyWithPreload = <T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): LazyWithPreload<T> => {
  const Component = lazy(factory) as LazyWithPreload<T>;
  Component.preload = factory;
  return Component;
};

const AdminLayout = lazy(() => import("./components/layout/AdminLayout"));
const Notice = lazyWithPreload(() => import("./routes/notice/Notice"));
const BoothMap = lazyWithPreload(() => import("./routes/boothmap/BoothMap"));
const MyPage = lazyWithPreload(() => import("./routes/mypage/MyPage"));
const Admin = lazy(() => import("./routes/admin/Admin"));
const AdminLogin = lazy(() => import("./routes/admin/AdminLogin"));
const AdminMap = lazy(() => import("./routes/admin/AdminMap"));
const ROUTE_WARMUP_FALLBACK_DELAY_MS = 160;
const ROUTE_WARMUP_IDLE_TIMEOUT_MS = 1400;

function RouteLoading() {
  return <DelayedSpinner delayMs={300} label="페이지 전환 중" />;
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
  const location = useLocation();

  useEffect(() => {
    registerRoutePreloader("/notice", Notice.preload);
    registerRoutePreloader("/map", BoothMap.preload);
    registerRoutePreloader("/mypage", MyPage.preload);

    const runWarmup = () => {
      void preloadBottomNavLazyRoutes();
      void prefetchBottomNavTabData();
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(
        () => {
          runWarmup();
        },
        { timeout: ROUTE_WARMUP_IDLE_TIMEOUT_MS },
      );

      return () => {
        if (typeof window.cancelIdleCallback === "function") {
          window.cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = window.setTimeout(() => {
      runWarmup();
    }, ROUTE_WARMUP_FALLBACK_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const firstFrameId = window.requestAnimationFrame(() => {
      const secondFrameId = window.requestAnimationFrame(() => {
        if (cancelled) {
          return;
        }
        markBottomNavTransitionComplete(location.pathname);
      });

      if (cancelled) {
        window.cancelAnimationFrame(secondFrameId);
      }
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(firstFrameId);
    };
  }, [location.pathname]);

  return (
    <Routes>
      {/* 일반 사용자: 헤더/바텀네비 적용 */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/notice" element={withRouteSuspense(<Notice />)} />
        <Route path="/timetable" element={<Timetable />} />
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

      <Route path="/ticket/*" element={<TicketingApp />} />

      <Route path="/login" element={<Navigate to="/ticket/login" replace />} />
      <Route path="/signup" element={<Navigate to="/ticket/signup" replace />} />
      <Route path="/reset-password" element={<Navigate to="/ticket/reset-password" replace />} />
      <Route path="/ticketing" element={<Navigate to="/ticket/ticketing" replace />} />
      <Route path="/myticket" element={<LegacyMyTicketRedirect />} />
    </Routes>
  );
}

export default App;
