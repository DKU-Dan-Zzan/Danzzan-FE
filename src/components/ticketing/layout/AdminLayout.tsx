import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
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
        <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between px-8 py-3">
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              ADMIN PORTAL
            </p>
            <h1 className="text-2xl font-semibold text-foreground">팔찌 배부 관리자 포털</h1>
          </div>
          <div className="flex items-center gap-2">
            {env.apiMode === "mock" && (
              <span className="rounded-full bg-[var(--admin-chip-warning-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--admin-chip-warning-text)]">
                MOCK MODE
              </span>
            )}
            <span className="rounded-full border border-[var(--admin-operator-badge-border)] bg-[var(--admin-operator-badge-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--admin-operator-badge-text)]">
              운영자: 관리자
            </span>
            <Button variant="outline" onClick={handleLogout} className="h-8 px-3 text-sm">
              <LogOut className="h-4 w-4" strokeWidth={2.3} />
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
