import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAdminAuth } from "../../hooks/useAdminAuth";

function Admin() {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-dvh bg-[var(--bg-base)]">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-3">
        <h1 className="text-lg font-bold text-[var(--text)]">관리자 페이지</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--border-base)] hover:text-[var(--text)]"
        >
          <LogOut className="h-4 w-4" strokeWidth={2.3} />
          로그아웃
        </button>
      </header>
      <main className="p-4">
        <p className="text-[var(--text-muted)]">공지사항/분실물 관리 메뉴는 추후 추가됩니다.</p>
      </main>
    </div>
  );
}

export default Admin;