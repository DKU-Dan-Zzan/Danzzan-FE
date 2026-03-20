import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ticketing/common/ui/button";
import { useAuth } from "@/hooks/ticketing/useAuth";
import { env } from "@/utils/ticketing/env";
import { TicketAdminShell } from "@/components/ticketing/layout/TicketAdminShell";

export function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/ticket/admin");
  };

  return (
    <TicketAdminShell
      actions={
        <>
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
        </>
      }
    >
        <Outlet />
    </TicketAdminShell>
  );
}
