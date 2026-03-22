// 역할: 앱 하단 고정 탭 내비게이션을 렌더링하고 인증 상태에 따라 티켓팅 탭 경로를 결정합니다.
import { NavLink } from "react-router-dom";
import { Clock, Home, Map, Megaphone, Ticket, User } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/components/common/ui/utils";
import { hasAuthenticatedRole } from "@/lib/common/auth-access";
import { getTicketingNavigationTarget } from "@/lib/common/ticketing-navigation";
import { authStore } from "@/store/common/authStore";

const navItems = [
  { to: "/", icon: Home, label: "홈" },
  { to: "/timetable", icon: Clock, label: "타임테이블" },
  { to: "/map", icon: Map, label: "부스맵" },
  { to: "/notice", icon: Megaphone, label: "공지사항" },
  { to: "/mypage", icon: User, label: "내정보" },
];

const BOTTOM_NAV_WRAPPER_CLASS =
  "fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[var(--app-mobile-shell-max-width)] h-[calc(var(--app-bottom-nav-height,56px)_+_env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]";
const BOTTOM_NAV_ITEM_BASE_CLASS =
  "relative flex h-full flex-1 flex-col items-center justify-center text-[length:var(--app-bottom-nav-label-size)] transition-[color,transform] duration-200 ease-out active:scale-[0.97] motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-nav-bg)]";
const BOTTOM_NAV_ITEM_ACTIVE_CLASS = "text-[var(--app-nav-text-active)]";
const BOTTOM_NAV_ITEM_INACTIVE_CLASS = "text-[var(--app-nav-text)]";
const BOTTOM_NAV_ICON_BASE_CLASS =
  "h-[var(--app-bottom-nav-icon-size)] w-[var(--app-bottom-nav-icon-size)] transition-transform duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none";
const BOTTOM_NAV_ICON_ACTIVE_CLASS = "-translate-y-[1px] scale-[1.04]";
const BOTTOM_NAV_ICON_INACTIVE_CLASS = "translate-y-0 scale-100";
const BOTTOM_NAV_INDICATOR_BASE_CLASS =
  "absolute bottom-[var(--app-bottom-nav-indicator-bottom)] h-[var(--app-bottom-nav-indicator-height)] w-[var(--app-bottom-nav-indicator-width)] origin-center rounded-full bg-[var(--app-nav-text-active)] transition-[opacity,transform] duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none";
const BOTTOM_NAV_INDICATOR_ACTIVE_CLASS = "opacity-100 scale-x-100";
const BOTTOM_NAV_INDICATOR_INACTIVE_CLASS = "opacity-0 scale-x-50";
const BOTTOM_NAV_LABEL_BASE_CLASS =
  "mt-1 text-center leading-none transition-transform duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none";
const BOTTOM_NAV_LABEL_ACTIVE_CLASS = "-translate-y-px font-semibold";
const BOTTOM_NAV_LABEL_INACTIVE_CLASS = "font-medium";

const BottomNav = () => {
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
  const items = [
    ...navItems.slice(0, 4),
    { to: ticketingTarget, icon: Ticket, label: "티켓팅" },
    navItems[4],
  ];

  return (
    <nav
      data-app-bottom-nav
      className={BOTTOM_NAV_WRAPPER_CLASS}
    >
      <div className="absolute inset-0 border-t border-[var(--app-nav-border)] bg-[var(--app-nav-bg)] shadow-[var(--app-nav-shadow)] backdrop-blur-[16px]" />

      <div className="relative flex h-[var(--app-bottom-nav-height)] items-center">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => cn(
              BOTTOM_NAV_ITEM_BASE_CLASS,
              isActive ? BOTTOM_NAV_ITEM_ACTIVE_CLASS : BOTTOM_NAV_ITEM_INACTIVE_CLASS,
            )}
          >
            {({ isActive }) => (
              <>
                <Icon
                  strokeWidth={2}
                  className={cn(
                    BOTTOM_NAV_ICON_BASE_CLASS,
                    isActive ? BOTTOM_NAV_ICON_ACTIVE_CLASS : BOTTOM_NAV_ICON_INACTIVE_CLASS,
                  )}
                />

                <div
                  className={cn(
                    BOTTOM_NAV_INDICATOR_BASE_CLASS,
                    isActive ? BOTTOM_NAV_INDICATOR_ACTIVE_CLASS : BOTTOM_NAV_INDICATOR_INACTIVE_CLASS,
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
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
