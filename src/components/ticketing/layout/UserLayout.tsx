import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/ticketing/useAuth";
import BottomNav from "@/components/layout/BottomNav";
import { AppHeaderLogo } from "@/components/layout/AppHeaderLogo";

export function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const isAuthPage = location.pathname === "/ticket/login" || location.pathname === "/ticket/signup";
  const isTicketingPage = location.pathname.startsWith("/ticket/ticketing");
  const isMyTicketPage = location.pathname.startsWith("/ticket/myticket");
  const showHeader = isAuthenticated && role === "student" && !isAuthPage;
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

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--bg-base)]">
      {showHeader && (
        <>
          <div
            aria-hidden="true"
            className="app-main-header pointer-events-none fixed inset-x-0 top-0 z-30 h-[max(env(safe-area-inset-top),2.75rem)] sm:hidden"
          />
          <header className="app-main-header sticky top-0 z-40 border-b border-[var(--app-header-border)] pt-[env(safe-area-inset-top)]">
            <div className="relative mx-auto h-16 w-full max-w-md px-4">
              <AppHeaderLogo />

              <button
                onClick={handleBack}
                className="app-header-ticket-button absolute top-1/2 left-4 -translate-y-1/2"
                aria-label="뒤로가기"
                title="뒤로가기"
              >
                <ArrowLeft size={18} className="app-header-ticket-icon" />
              </button>

              <h1 className="sr-only">{pageTitle}</h1>
            </div>
          </header>
        </>
      )}

      <main
        className={
          showHeader
            ? `relative mx-auto w-full max-w-md px-4 ${isMyTicketPage ? "pt-3" : "pt-[var(--app-header-first-card-gap)]"} ${bottomNavPaddingClass}`
            : `relative mx-auto min-h-screen w-full max-w-md ${bottomNavPaddingClass}`
        }
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
