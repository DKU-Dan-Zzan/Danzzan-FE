// 역할: 티켓팅 사용자 화면 공통 상단바와 본문 레이아웃을 제공합니다.
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/ticketing/useAuth";
import BottomNav from "@/components/layout/BottomNav";
import Footer from "@/components/layout/Footer";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { AppShell } from "@/components/layout/AppShell";
import { APP_HEADER_ROUND_BUTTON_BASE_CLASS } from "@/components/layout/appHeaderRoundButtonClass";
import { shouldShowTicketingHeader } from "@/lib/ticketing/navigation/headerVisibility";

export function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, role } = useAuth();
  const isTicketingLoginPage = location.pathname === "/ticket/login";
  const isTicketingAuthPage =
    isTicketingLoginPage ||
    location.pathname === "/ticket/signup" ||
    location.pathname.startsWith("/ticket/reset-password");
  const isTicketingPage = location.pathname.startsWith("/ticket/ticketing");
  const isBackButtonDisabled = isTicketingLoginPage || isTicketingPage;
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

  const contentTopPaddingClass = isMyTicketPage
    ? "pt-3"
    : isTicketingAuthPage
      ? "pt-1"
      : "pt-[var(--app-header-first-card-gap)]";
  const mainClassName = showHeader
    ? "flex-1 overflow-x-hidden pt-[calc(env(safe-area-inset-top)+4rem)]"
    : "flex-1 overflow-x-hidden";

  return (
    <AppShell
      colorScheme="webapp"
      header={
        showHeader ? (
          <AppTopBar
            title={pageTitle}
            showSafeAreaOverlay
            headerClassName="fixed inset-x-0 top-0 z-40 border-b border-[var(--app-header-border)] bg-[var(--app-header-bg)] [background-image:var(--app-header-bg-gradient)] bg-no-repeat bg-[length:100%_100%] pt-[env(safe-area-inset-top)]"
            containerClassName="relative mx-auto h-16 w-full max-w-md px-4"
          >
            <button
              onClick={isBackButtonDisabled ? undefined : handleBack}
              disabled={isBackButtonDisabled}
              aria-disabled={isBackButtonDisabled}
              className={`${APP_HEADER_ROUND_BUTTON_BASE_CLASS} left-4`}
              aria-label="뒤로가기"
              title={isBackButtonDisabled ? "뒤로가기 비활성화" : "뒤로가기"}
            >
              <ArrowLeft size={20} className="text-[var(--app-header-ticket-btn-icon)]" />
            </button>
          </AppTopBar>
        ) : undefined
      }
      footer={<Footer />}
      bottomNav={<BottomNav />}
      rootClassName="min-h-dvh overflow-x-hidden bg-[var(--bg-base)]"
      frameClassName="mx-auto flex min-h-dvh w-full max-w-[var(--app-mobile-shell-max-width)] flex-col bg-[var(--bg-base)] pb-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))]"
      mainClassName={mainClassName}
    >
      <div
        className={
          showHeader
            ? `relative mx-auto min-h-full w-full max-w-md px-4 ${contentTopPaddingClass}`
            : "relative mx-auto min-h-full w-full max-w-md"
        }
      >
        <Outlet />
      </div>
    </AppShell>
  );
}
