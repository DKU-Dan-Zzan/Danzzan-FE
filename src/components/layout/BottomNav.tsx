// 역할: 앱 하단 고정 탭 내비게이션을 렌더링하고 인증 상태에 따라 티켓팅 탭 경로를 결정합니다.
import { NavLink } from "react-router-dom";
import { Clock3, Home, Map, Megaphone, Ticket } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { cn } from "@/components/common/ui/utils";
import { hasAuthenticatedRole } from "@/lib/common/auth-access";
import { getTicketingNavigationTarget } from "@/lib/common/ticketing-navigation";
import { preloadRouteByPath } from "@/lib/navigation/routePreload";
import { markBottomNavTransitionStart } from "@/lib/perf/navTiming";
import { prefetchTabDataByPath } from "@/lib/query/prefetchTabData";
import { authStore } from "@/store/common/authStore";

type BottomNavItem = {
  to: string;
  icon: typeof Home;
  label: string;
  center?: boolean;
};

const STATIC_ITEMS: BottomNavItem[] = [
  { to: "/map", icon: Map, label: "부스맵" },
  { to: "/timetable", icon: Clock3, label: "타임테이블" },
  { to: "/", icon: Home, label: "HOME", center: true },
  { to: "/notice", icon: Megaphone, label: "공지사항" },
];

const BOTTOM_NAV_WRAPPER_CLASS =
  "fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[var(--app-mobile-shell-max-width)] h-[calc(var(--app-bottom-nav-height,64px)_+_env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] [animation:ec-fade-up_320ms_ease-out_both]";
const BOTTOM_NAV_PANEL_CLASS =
  "absolute inset-x-0 bottom-0 h-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))] rounded-t-[1.75rem] bg-[var(--app-bottom-nav-surface)] shadow-[0_-6px_18px_rgba(44,52,54,0.09)]";
const BOTTOM_NAV_GRID_CLASS =
  "relative grid h-[var(--app-bottom-nav-height)] grid-cols-5 items-end px-3 pb-1";
const BOTTOM_NAV_ITEM_BASE_CLASS =
  "relative flex h-full flex-col items-center justify-center gap-1 text-[length:var(--app-bottom-nav-label-size)] tracking-[0.08em] transition-[color,transform] duration-150 ease-out active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-bottom-nav-surface)]";
const BOTTOM_NAV_ITEM_ACTIVE_CLASS = "text-[var(--app-nav-home-highlight)]";
const BOTTOM_NAV_ITEM_INACTIVE_CLASS = "text-[var(--app-nav-text)]";
const BOTTOM_NAV_ICON_BASE_CLASS =
  "h-[var(--app-bottom-nav-icon-size)] w-[var(--app-bottom-nav-icon-size)] transition-transform duration-150 ease-out motion-reduce:transform-none motion-reduce:transition-none";
const BOTTOM_NAV_ICON_ACTIVE_CLASS = "translate-y-0 scale-[1.03]";
const BOTTOM_NAV_ICON_INACTIVE_CLASS = "translate-y-0 scale-100";
const BOTTOM_NAV_LABEL_BASE_CLASS =
  "text-center text-[11px] leading-none transition-transform duration-150 ease-out motion-reduce:transform-none motion-reduce:transition-none";
const BOTTOM_NAV_LABEL_ACTIVE_CLASS = "translate-y-0 font-semibold";
const BOTTOM_NAV_LABEL_INACTIVE_CLASS = "font-semibold opacity-85";
const BOTTOM_NAV_HOME_LINK_CLASS =
  "group relative flex h-full items-start justify-center pt-0 focus-visible:outline-none";
const BOTTOM_NAV_HOME_BUTTON_CLASS =
  "inline-flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full bg-[var(--app-nav-home-highlight)] text-[var(--on-primary)] shadow-[var(--ec-ambient-shadow)] transition-transform duration-150 ease-out active:scale-[0.96] motion-reduce:transform-none group-focus-visible:ring-2 group-focus-visible:ring-[var(--ring)] group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[var(--app-bottom-nav-surface)]";
const BOTTOM_NAV_HOME_ICON_CLASS = "h-[22px] w-[22px]";
const APP_BOTTOM_NAV_RUNTIME_OFFSET_VAR = "--app-bottom-nav-runtime-offset";

const BottomNav = () => {
  const navRef = useRef<HTMLElement | null>(null);
  const session = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot,
  );
  const hasTicketingAccess = hasAuthenticatedRole({
    accessToken: session.tokens?.accessToken,
    role: session.role,
    requiredRole: "student",
  });
  const ticketingTarget = getTicketingNavigationTarget(hasTicketingAccess);
  const items: BottomNavItem[] = [
    ...STATIC_ITEMS,
    { to: ticketingTarget, icon: Ticket, label: "티켓팅" },
  ];

  const warmTabRoute = (routePath: string) => {
    void preloadRouteByPath(routePath);
    void prefetchTabDataByPath(routePath);
  };

  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return;

    const rootStyle = document.documentElement.style;
    const updateBottomOffset = () => {
      const navTop = navElement.getBoundingClientRect().top;
      const bottomOffset = Math.max(0, Math.round(window.innerHeight - navTop));
      rootStyle.setProperty(APP_BOTTOM_NAV_RUNTIME_OFFSET_VAR, `${bottomOffset}px`);
    };

    updateBottomOffset();

    window.addEventListener("resize", updateBottomOffset);
    window.addEventListener("orientationchange", updateBottomOffset);
    window.visualViewport?.addEventListener("resize", updateBottomOffset);
    navElement.addEventListener("animationend", updateBottomOffset);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateBottomOffset);
    resizeObserver?.observe(navElement);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateBottomOffset);
      window.removeEventListener("orientationchange", updateBottomOffset);
      window.visualViewport?.removeEventListener("resize", updateBottomOffset);
      navElement.removeEventListener("animationend", updateBottomOffset);
      rootStyle.removeProperty(APP_BOTTOM_NAV_RUNTIME_OFFSET_VAR);
    };
  }, []);

  return (
    <nav
      data-app-bottom-nav
      ref={navRef}
      className={BOTTOM_NAV_WRAPPER_CLASS}
    >
      <div className={BOTTOM_NAV_PANEL_CLASS} />

      <div className={BOTTOM_NAV_GRID_CLASS}>
        {items.map(({ to, icon: Icon, label, center }) => {
          if (center) {
            return (
              <NavLink
                key={to}
                to={to}
                end
                onPointerEnter={() => {
                  warmTabRoute(to);
                }}
                onFocus={() => {
                  warmTabRoute(to);
                }}
                onTouchStart={() => {
                  warmTabRoute(to);
                }}
                onClick={() => {
                  markBottomNavTransitionStart(to);
                  warmTabRoute(to);
                }}
                className={BOTTOM_NAV_HOME_LINK_CLASS}
                aria-label={label}
              >
                {({ isActive }) => (
                  <>
                    <span className={cn(BOTTOM_NAV_HOME_BUTTON_CLASS, isActive && "scale-[1.02]")}>
                      <Icon strokeWidth={2.6} className={BOTTOM_NAV_HOME_ICON_CLASS} />
                    </span>
                    <span className="sr-only">{label}</span>
                  </>
                )}
              </NavLink>
            );
          }

          return (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onPointerEnter={() => {
                warmTabRoute(to);
              }}
              onFocus={() => {
                warmTabRoute(to);
              }}
              onTouchStart={() => {
                warmTabRoute(to);
              }}
              onClick={() => {
                markBottomNavTransitionStart(to);
                warmTabRoute(to);
              }}
              className={({ isActive }) => cn(
                BOTTOM_NAV_ITEM_BASE_CLASS,
                isActive ? BOTTOM_NAV_ITEM_ACTIVE_CLASS : BOTTOM_NAV_ITEM_INACTIVE_CLASS,
              )}
              aria-label={label}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    strokeWidth={2.05}
                    className={cn(
                      BOTTOM_NAV_ICON_BASE_CLASS,
                      isActive ? BOTTOM_NAV_ICON_ACTIVE_CLASS : BOTTOM_NAV_ICON_INACTIVE_CLASS,
                    )}
                  />
                  <span
                    className={cn(
                      BOTTOM_NAV_LABEL_BASE_CLASS,
                      isActive ? BOTTOM_NAV_LABEL_ACTIVE_CLASS : BOTTOM_NAV_LABEL_INACTIVE_CLASS,
                    )}
                  >
                    {label}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block h-[2px] rounded-full bg-[var(--app-nav-home-highlight)] transition-all duration-150",
                      isActive ? "w-4 opacity-100" : "w-0 opacity-0",
                    )}
                  />
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
