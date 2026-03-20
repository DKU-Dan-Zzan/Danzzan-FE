import { NavLink } from "react-router-dom";
import { Clock, Home, Map, Megaphone, Ticket, User } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "홈" },
  { to: "/timetable", icon: Clock, label: "타임테이블" },
  { to: "/map", icon: Map, label: "부스맵" },
  { to: "/notice", icon: Megaphone, label: "공지사항" },
  { to: "/ticket/ticketing", icon: Ticket, label: "티켓팅" },
  { to: "/mypage", icon: User, label: "내정보" },
];

const BottomNav = () => {
  return (
    <nav
      data-app-bottom-nav
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[430px] h-[calc(var(--app-bottom-nav-height,56px)_+_env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="absolute inset-0 border-t border-[var(--app-nav-border)] bg-[var(--app-nav-bg)] shadow-[var(--app-nav-shadow)] backdrop-blur-[16px]" />

      <div className="relative flex h-[var(--app-bottom-nav-height)] items-center">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `relative flex h-full flex-1 flex-col items-center justify-center text-[length:var(--app-bottom-nav-label-size)] transition-all duration-200 ${isActive ? "text-[var(--app-nav-text-active)]" : "text-[var(--app-nav-text)]"}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon strokeWidth={2} className="h-[var(--app-bottom-nav-icon-size)] w-[var(--app-bottom-nav-icon-size)]" />

                {isActive && (
                  <div className="absolute bottom-[var(--app-bottom-nav-indicator-bottom)] h-[var(--app-bottom-nav-indicator-height)] w-[var(--app-bottom-nav-indicator-width)] rounded-full bg-[var(--accent)]" />
                )}

                <span className="mt-1 text-center leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
