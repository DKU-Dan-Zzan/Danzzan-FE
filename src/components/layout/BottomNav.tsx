import { NavLink } from "react-router-dom";
import { Clock, Home, Map, Megaphone, Ticket, User } from "lucide-react";
import { useSyncExternalStore } from "react";
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
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[430px] h-[calc(var(--app-bottom-nav-height,56px)_+_env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="absolute inset-0 border-t border-[var(--app-nav-border)] bg-[var(--app-nav-bg)] shadow-[var(--app-nav-shadow)] backdrop-blur-[16px]" />

      <div className="relative flex h-[var(--app-bottom-nav-height)] items-center">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `relative flex h-full flex-1 flex-col items-center justify-center text-[length:var(--app-bottom-nav-label-size)] transition-[color,transform] duration-200 ease-out active:scale-[0.97] motion-reduce:transform-none motion-reduce:transition-none ${isActive ? "text-[var(--app-nav-text-active)]" : "text-[var(--app-nav-text)]"}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  strokeWidth={2}
                  className={`h-[var(--app-bottom-nav-icon-size)] w-[var(--app-bottom-nav-icon-size)] transition-transform duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none ${isActive ? "-translate-y-[1px] scale-[1.04]" : "translate-y-0 scale-100"}`}
                />

                <div
                  className={`absolute bottom-[var(--app-bottom-nav-indicator-bottom)] h-[var(--app-bottom-nav-indicator-height)] w-[var(--app-bottom-nav-indicator-width)] origin-center rounded-full bg-[var(--app-nav-text-active)] transition-[opacity,transform] duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none ${isActive ? "opacity-100 scale-x-100" : "opacity-0 scale-x-50"}`}
                />

                <span
                  className={`mt-1 text-center leading-none transition-transform duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none ${isActive ? "-translate-y-px font-semibold" : "font-medium"}`}
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
