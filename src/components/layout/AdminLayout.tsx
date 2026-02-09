import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/common/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdminSystem } from "@/hooks/useAdminSystem";
import { env } from "@/utils/env";

const linkBase =
  "rounded-md px-4 py-2 text-sm font-semibold transition-colors";

export function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const adminSystem = useAdminSystem();

  const handleLogout = () => {
    logout();
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-8 py-6">
          <div>
            <p className="text-sm text-blue-600 font-semibold">DANZZAN Operations</p>
            <h1 className="text-2xl font-semibold text-gray-900">통합 관리자 포털</h1>
          </div>
          <div className="flex items-center gap-3">
            {env.apiMode === "mock" && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                MOCK MODE
              </span>
            )}
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              관리자
            </span>
            <Button variant="outline" onClick={handleLogout} className="h-9">
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1600px] px-8 py-6">
        <nav className="flex flex-wrap items-center gap-2">
          {adminSystem === "wristband" && (
            <NavLink
              to="/admin/wristband"
              end
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              Wristband
            </NavLink>
          )}
          {adminSystem === "board" && (
            <>
              <NavLink
                to="/admin/board"
                end
                className={({ isActive }) =>
                  `${linkBase} ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                Notice
              </NavLink>
              <NavLink
                to="/admin/board/lostfound"
                end
                className={({ isActive }) =>
                  `${linkBase} ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                Lost&Found
              </NavLink>
            </>
          )}
        </nav>

        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
