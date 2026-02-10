import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/common/ui/button";
import { useAuth } from "@/hooks/useAuth";

const linkBase =
  "rounded-md px-3 py-2 text-sm font-medium transition-colors";

export function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role, logout } = useAuth();
  const isLogin = location.pathname === "/login";
  const showNav = isAuthenticated && role === "student" && !isLogin;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showNav && (
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm text-gray-500">DAN-ZZAN Ticketing</p>
              <h1 className="text-xl font-semibold text-gray-900">학생 티켓 시스템</h1>
            </div>
            <div className="flex items-center gap-3">
              <nav className="flex items-center gap-2">
                <NavLink
                  to="/ticketing"
                  className={({ isActive }) =>
                    `${linkBase} ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`
                  }
                >
                  티켓 예매
                </NavLink>
                <NavLink
                  to="/myticket"
                  className={({ isActive }) =>
                    `${linkBase} ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`
                  }
                >
                  내 티켓
                </NavLink>
              </nav>
              <Button variant="outline" onClick={handleLogout} className="h-9">
                로그아웃
              </Button>
            </div>
          </div>
        </header>
      )}

      <main
        className={
          showNav
            ? "mx-auto w-full max-w-5xl px-6 py-8"
            : "min-h-screen"
        }
      >
        <Outlet />
      </main>
    </div>
  );
}
