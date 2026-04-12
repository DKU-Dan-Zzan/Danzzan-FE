import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { useAuth } from "@/hooks/ticketing/useAuth";
import BottomNav from "@/components/layout/BottomNav";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { AppShell } from "@/components/layout/AppShell";
import { shouldShowTicketingHeader } from "@/lib/ticketing/navigation/headerVisibility";
import { cn } from "@/components/common/ui/utils";

const HEADER_ICON_BUTTON_CLASS =
  "absolute top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center text-[color:color-mix(in_srgb,var(--text)_96%,black)] transition-colors duration-150 hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

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
  const searchParams = new URLSearchParams(location.search);
  const hasQueueEventId = searchParams.has("eventId");
  const isTicketingListPage = searchParams.has("list");
  const isTicketingMainPage = location.pathname === "/ticket/ticketing" && !hasQueueEventId && !isTicketingListPage;
  const isMyTicketPage =
    location.pathname.startsWith("/ticket/my-ticket") ||
    location.pathname.startsWith("/ticket/myticket");
  const showHeader = shouldShowTicketingHeader({
    pathname: location.pathname,
    accessToken: session.tokens?.accessToken,
    role,
  });
  const showBackButton = !isTicketingMainPage && !isTicketingLoginPage;
  const pageTitle = "축제 서비스";

  const handleBack = () => {
    if (isTicketingListPage || hasQueueEventId) {
      navigate("/ticket/ticketing", { replace: true, state: { resetToHome: Date.now() } });
      return;
    }

    const historyIndex = window.history.state?.idx;
    const canGoBack = typeof historyIndex === "number" && historyIndex > 0;

    if (canGoBack) {
      navigate(-1);
      return;
    }

    if (isTicketingPage) {
      navigate("/ticket/ticketing", { replace: true, state: { resetToHome: Date.now() } });
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
      ? "pt-0"
      : "pt-[var(--app-header-first-card-gap)]";
  const mainClassName = showHeader
    ? isTicketingAuthPage
      ? "flex-1 overflow-x-hidden"
      : "flex-1 overflow-x-hidden pt-[calc(env(safe-area-inset-top)+68px)]"
    : "flex-1 overflow-x-hidden";

  return (
    <AppShell
      colorScheme="webapp"
      header={
        showHeader ? (
          <AppTopBar
            title={pageTitle}
            showSafeAreaOverlay
            showLogo={false}
            headerClassName="fixed inset-x-0 top-0 z-50 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_62%,transparent)_0%,color-mix(in_srgb,var(--surface)_40%,transparent)_36%,color-mix(in_srgb,var(--surface)_18%,transparent)_72%,color-mix(in_srgb,var(--surface)_0%,transparent)_100%)] backdrop-blur-[24px] shadow-none pt-[env(safe-area-inset-top)]"
            containerClassName="relative mx-auto h-[68px] w-full max-w-[430px] px-4"
          >
            <img
              src="/DAN-ZZAN.png"
              alt="DAN-ZZAN"
              className="pointer-events-none absolute left-1/2 top-1/2 h-12 w-[172px] -translate-x-1/2 -translate-y-1/2 object-contain select-none"
              draggable={false}
            />

            {showBackButton && (
              <button
                onClick={handleBack}
                className={cn(HEADER_ICON_BUTTON_CLASS, "left-4")}
                aria-label="뒤로가기"
                title="뒤로가기"
              >
                <ArrowLeft size={20} />
              </button>
            )}

            {!isTicketingAuthPage && (
              <button
                onClick={() => navigate("/mypage")}
                className={cn(HEADER_ICON_BUTTON_CLASS, "right-4")}
                aria-label="내정보"
                title="내정보"
              >
                <User size={22} />
              </button>
            )}
          </AppTopBar>
        ) : undefined
      }
      bottomNav={<BottomNav />}
      rootClassName="min-h-dvh overflow-x-hidden bg-[var(--bg-base)]"
      frameClassName="mx-auto flex min-h-dvh w-full max-w-[var(--app-mobile-shell-max-width)] flex-col bg-[var(--bg-base)] pb-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))]"
      mainClassName={mainClassName}
    >
      <div
        className={[
          "relative mx-auto min-h-full w-full max-w-md",
          showHeader && "px-4",
          showHeader && contentTopPaddingClass,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Outlet />
      </div>
    </AppShell>
  );
}
