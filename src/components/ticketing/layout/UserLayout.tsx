// 역할: 티켓팅 도메인 화면 구성을 위한 UI 컴포넌트를 제공합니다.
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/ticketing/useAuth";
import BottomNav from "@/components/layout/BottomNav";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { AppShell } from "@/components/layout/AppShell";
import { shouldShowTicketingHeader } from "@/lib/ticketing/navigation/headerVisibility";

export function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, role } = useAuth();
  const isTicketingAuthPage =
    location.pathname === "/ticket/login" ||
    location.pathname === "/ticket/signup" ||
    location.pathname.startsWith("/ticket/reset-password");
  const isTicketingPage = location.pathname.startsWith("/ticket/ticketing");
  const isMyTicketPage =
    location.pathname.startsWith("/ticket/my-ticket") ||
    location.pathname.startsWith("/ticket/myticket");
  const showHeader = shouldShowTicketingHeader({
    pathname: location.pathname,
    accessToken: session.tokens?.accessToken,
    role,
  });
  const pageTitle = "축제 포털";

  const handleBack = () => {
    if (isTicketingPage) {
      navigate("/ticket/ticketing", { replace: true, state: { resetToHome: Date.now() } });
      return;
    }

    const historyIndex = window.history.state?.idx;
    const canGoBack = typeof historyIndex === "number" && historyIndex > 0;

    if (canGoBack) {
      navigate(-1);
      return;
    }

    if (isMyTicketPage) {
      navigate("/ticket/ticketing", { replace: true, state: { resetToHome: Date.now() } });
      return;
    }

    navigate("/ticket/login", { replace: true });
  };

  const bottomNavPaddingClass = "pb-[calc(84px+env(safe-area-inset-bottom)+0.75rem)]";
  const contentTopPaddingClass = isMyTicketPage
    ? "pt-3"
    : isTicketingAuthPage
      ? "pt-1"
      : "pt-[var(--app-header-first-card-gap)]";

  return (
    <AppShell
      header={
        showHeader ? (
          <AppTopBar
            title={pageTitle}
            showSafeAreaOverlay
            headerClassName="sticky top-0 z-40 border-b border-[var(--app-header-border)] bg-[var(--app-header-bg)] [background-image:var(--app-header-bg-gradient)] bg-no-repeat bg-[length:100%_100%] pt-[env(safe-area-inset-top)]"
            containerClassName="relative mx-auto h-16 w-full max-w-md px-4"
          >
            <button
              onClick={handleBack}
              className="absolute top-1/2 left-4 flex h-[var(--app-header-ticket-btn-size)] w-[var(--app-header-ticket-btn-size)] -translate-y-1/2 items-center justify-center rounded-full border border-[var(--app-header-ticket-btn-border)] bg-[linear-gradient(145deg,var(--app-header-ticket-btn-bg-start)_0%,var(--app-header-ticket-btn-bg-end)_100%)] shadow-[var(--app-header-ticket-btn-shadow)] backdrop-blur-[6px] transition-[transform,box-shadow,filter] duration-[180ms] hover:shadow-[var(--app-header-ticket-btn-shadow-hover)] hover:brightness-[1.01] active:scale-[0.96]"
              aria-label="뒤로가기"
              title="뒤로가기"
            >
              <ArrowLeft size={18} className="text-[var(--app-header-ticket-btn-icon)]" />
            </button>
          </AppTopBar>
        ) : undefined
      }
      bottomNav={<BottomNav />}
      rootClassName="min-h-screen overflow-x-hidden bg-[var(--bg-base)]"
      frameClassName="mx-auto flex min-h-screen w-full flex-col"
      mainClassName="flex-1 overflow-x-hidden"
    >
      <div
        className={
          showHeader
            ? `relative mx-auto w-full max-w-md px-4 ${contentTopPaddingClass} ${bottomNavPaddingClass}`
            : `relative mx-auto min-h-screen w-full max-w-md ${bottomNavPaddingClass}`
        }
      >
        <Outlet />
      </div>
    </AppShell>
  );
}
