import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, House, LogOut } from "lucide-react";
import { Button } from "@/components/common/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role, logout } = useAuth();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";
  const isTicketingPage = location.pathname.startsWith("/ticketing");
  const isMyTicketPage = location.pathname.startsWith("/myticket");
  const showHeader = isAuthenticated && role === "student" && !isAuthPage;
  const pageTitle = "티켓팅 포털";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleBack = () => {
    if (isTicketingPage) {
      navigate("/ticketing", { replace: true, state: { resetToHome: Date.now() } });
      return;
    }

    const historyIndex = window.history.state?.idx;
    const canGoBack = typeof historyIndex === "number" && historyIndex > 0;

    if (canGoBack) {
      navigate(-1);
      return;
    }

    if (isMyTicketPage) {
      navigate("/ticketing", { replace: true, state: { resetToHome: Date.now() } });
      return;
    }

    navigate("/login", { replace: true });
  };

  const handleGoHome = () => {
    navigate("/ticketing", {
      replace: isTicketingPage,
      state: { resetToHome: Date.now() },
    });
  };

  return (
      <div className="min-h-screen overflow-x-hidden bg-[var(--bg-base)]">
      {showHeader && (
        <header className="sticky top-0 z-40 border-b border-[var(--border-base)] bg-[var(--surface-subtle)] shadow-[0_1px_0_rgba(255,255,255,0.7)] backdrop-blur supports-[backdrop-filter]:bg-[var(--surface-base)]">
          <div className="mx-auto flex h-16 w-full max-w-md items-center gap-2 px-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="h-10 w-10 rounded-lg border border-[var(--border-base)] bg-[var(--surface-subtle)] p-0 text-[var(--text-muted)] hover:bg-[var(--surface-tint-subtle)]"
              aria-label="뒤로가기"
              title="뒤로가기"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="min-w-0 flex-1 px-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Student Portal
              </p>
              <h1 className="truncate text-[1.02rem] font-semibold tracking-[-0.01em] text-[var(--text)]">
                {pageTitle}
              </h1>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                onClick={handleGoHome}
                className="h-10 w-10 rounded-lg border border-[var(--border-base)] bg-[var(--surface-subtle)] p-0 text-[var(--text-muted)] hover:bg-[var(--surface-tint-subtle)]"
                aria-label="티켓팅 포털 홈으로 이동"
                title="티켓팅 포털 홈으로 이동"
              >
                <House className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="h-10 rounded-lg border border-[var(--border-base)] bg-[var(--surface-subtle)] px-2.5 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-tint-subtle)]"
                aria-label="로그아웃"
                title="로그아웃"
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </div>
          </div>
        </header>
      )}

      <main
        className={
          showHeader
            ? "relative mx-auto w-full max-w-md px-4 pt-6 pb-4"
            : "relative mx-auto min-h-screen w-full max-w-md"
        }
      >
        <Outlet />
      </main>
    </div>
  );
}
