import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, House, LogOut } from "lucide-react";
import { Button } from "@/ticketing/components/common/ui/button";
import { useAuth } from "@/hooks/ticketing/useAuth";

export function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role, logout } = useAuth();
  const isAuthPage = location.pathname === "/ticket/login" || location.pathname === "/ticket/signup";
  const isTicketingPage = location.pathname.startsWith("/ticket/ticketing");
  const isMyTicketPage = location.pathname.startsWith("/ticket/myticket");
  const showHeader = isAuthenticated && role === "student" && !isAuthPage;
  const pageTitle = "티켓팅 포털";

  const handleLogout = () => {
    logout();
    navigate("/ticket/login");
  };

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

  const handleGoHome = () => {
    navigate("/ticket/ticketing", {
      replace: isTicketingPage,
      state: { resetToHome: Date.now() },
    });
  };

  return (
      <div className="min-h-screen overflow-x-hidden bg-[var(--bg-base)]">
      {showHeader && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[max(env(safe-area-inset-top),2.75rem)] bg-[var(--header-bg)] sm:hidden"
          />
          <header className="sticky top-0 z-40 border-b border-[var(--header-border)] bg-[var(--header-bg)] pt-[env(safe-area-inset-top)] shadow-[0_1px_0_var(--header-border)] backdrop-blur supports-[backdrop-filter]:bg-[var(--header-bg)]">
            <div className="mx-auto flex h-16 w-full max-w-md items-center gap-2 px-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="h-10 w-10 rounded-lg border border-[var(--header-border)] bg-[var(--header-button-bg)] p-0 text-[var(--header-text)] hover:bg-[var(--header-button-hover)]"
                aria-label="뒤로가기"
                title="뒤로가기"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="min-w-0 flex-1 px-1">
                <p className="text-[length:var(--ticketing-text-header-overline)] font-semibold uppercase tracking-[0.16em] text-[var(--header-text-muted)]">
                  Student Portal
                </p>
                <h1 className="truncate text-[length:var(--ticketing-text-card-title)] font-semibold tracking-[-0.01em] text-[var(--header-text)]">
                  {pageTitle}
                </h1>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  onClick={handleGoHome}
                  className="h-10 w-10 rounded-lg border border-[var(--header-border)] bg-[var(--header-button-bg)] p-0 text-[var(--header-text)] hover:bg-[var(--header-button-hover)]"
                  aria-label="티켓팅 포털 홈으로 이동"
                  title="티켓팅 포털 홈으로 이동"
                >
                  <House className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="h-10 rounded-lg border border-[var(--header-border)] bg-[var(--header-button-bg)] px-2.5 text-[length:var(--ticketing-text-section-body-sm)] font-semibold text-[var(--header-text)] hover:bg-[var(--header-button-hover)]"
                  aria-label="로그아웃"
                  title="로그아웃"
                >
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </Button>
              </div>
            </div>
          </header>
        </>
      )}

      <main
        className={
          showHeader
            ? `relative mx-auto w-full max-w-md px-4 ${isMyTicketPage ? "pt-3 pb-2" : "pt-6 pb-4"}`
            : "relative mx-auto min-h-screen w-full max-w-md"
        }
      >
        <Outlet />
      </main>
    </div>
  );
}
