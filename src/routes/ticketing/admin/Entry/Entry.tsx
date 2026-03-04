import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ticketing/common/ui/card";
import { Button } from "@/components/ticketing/common/ui/button";

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
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Card className="w-full max-w-3xl p-10">
        <div className="space-y-2">
          <p className="text-sm text-primary font-semibold">DAN-ZZAN Operations</p>
          <h1 className="text-2xl font-semibold text-foreground">관리 시스템 선택</h1>
          <p className="text-sm text-muted-foreground">접속할 운영 시스템을 선택하세요.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {systems.map((system) => (
            <Card key={system.id} className="p-6 border-border shadow-sm">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">{system.title}</h2>
                <p className="text-sm text-muted-foreground">{system.description}</p>
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
