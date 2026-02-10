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
    <div className="min-h-screen bg-background">
      <header className="border-b border-[#c7d3e6] bg-card">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-8 py-6">
          <div>
            <p className="text-sm text-primary font-semibold">DAN-ZZAN Operations</p>
            <h1 className="text-2xl font-semibold text-foreground">통합 관리자 포털</h1>
          </div>
          <div className="flex items-center gap-3">
            {env.apiMode === "mock" && (
              <span className="rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning">
                MOCK MODE
              </span>
            )}
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
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
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted"
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
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted"
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
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted"
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
