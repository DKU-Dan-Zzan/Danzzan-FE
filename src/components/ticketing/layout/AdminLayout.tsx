import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ticketing/common/ui/button";
import { useAuth } from "@/hooks/ticketing/useAuth";
import { env } from "@/utils/ticketing/env";

export function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/ticket/admin");
  };

  return (
    <div className="min-h-screen bg-[var(--admin-page-bg)]">
      <header className="border-b border-[var(--border-base)] bg-[var(--admin-header-bg)]">
        <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between px-8 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              ADMIN PORTAL
            </p>
            <h1 className="text-3xl font-semibold text-foreground">팔찌 배부 관리자 포털</h1>
          </div>
          <div className="flex items-center gap-3">
            {env.apiMode === "mock" && (
              <span className="rounded-full bg-[var(--admin-chip-warning-bg)] px-3 py-1 text-sm font-semibold text-[var(--admin-chip-warning-text)]">
                MOCK MODE
              </span>
            )}
            <span className="rounded-full border border-[var(--admin-operator-badge-border)] bg-[var(--admin-operator-badge-bg)] px-3 py-1 text-sm font-semibold text-[var(--admin-operator-badge-text)]">
              운영자: 관리자
            </span>
            <Button variant="outline" onClick={handleLogout} className="h-9">
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1360px] px-8 py-6">
        <Outlet />
      </div>
    </div>
  );
}
