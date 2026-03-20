import { useNavigate } from "react-router-dom";
import { Card } from "@/components/common/ui/card";
import { Button } from "@/components/common/ui/button";

const systems = [
  {
    id: "wristband",
    title: "팔찌 배부 운영",
    description: "티켓 확인 및 팔찌 지급 현황을 관리합니다.",
  },
];

export default function AdminEntry() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--admin-auth-page-bg)] px-6">
      <Card className="w-full max-w-3xl border-[var(--admin-auth-card-border)] bg-[var(--admin-auth-card-bg)] p-10 shadow-[var(--admin-auth-card-shadow)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--admin-auth-brand-text)]">DAN-ZZAN Operations</p>
          <h1 className="text-2xl font-semibold text-foreground">관리 시스템 선택</h1>
          <p className="text-sm text-[var(--admin-auth-subtext)]">접속할 운영 시스템을 선택하세요.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {systems.map((system) => (
            <Card
              key={system.id}
              className="border-[var(--admin-auth-card-border)] bg-[var(--admin-auth-card-bg)] p-6 shadow-[var(--admin-auth-card-shadow)]"
            >
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">{system.title}</h2>
                <p className="text-sm text-[var(--admin-auth-subtext)]">{system.description}</p>
                <Button
                  className="w-full"
                  onClick={() => navigate("/ticket/admin/login")}
                >
                  로그인으로 이동
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
