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
      className="
        fixed bottom-0 left-0 right-0
        max-w-[430px] mx-auto
        h-[calc(var(--app-bottom-nav-height,56px)_+_env(safe-area-inset-bottom))]
        pb-[env(safe-area-inset-bottom)]
        z-50
      "
    >
      <div
        className="
          absolute inset-0
          bg-white/95 backdrop-blur-xl
          border-t border-gray-200
          shadow-[0_-8px_24px_rgba(0,0,0,0.06)]
        "
      />

      <div className="app-bottom-nav-inner relative flex items-center">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `
              flex-1
              relative flex h-full flex-col items-center justify-center
              app-bottom-nav-link transition-all duration-200
              ${isActive ? "text-blue-600" : "text-gray-400"}
              `
            }
          >
            {({ isActive }) => (
              <>
                <Icon strokeWidth={2} className="app-bottom-nav-icon" />

                {isActive && (
                  <div className="app-bottom-nav-indicator" />
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
