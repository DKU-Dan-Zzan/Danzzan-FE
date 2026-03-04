import { useNavigate } from "react-router-dom";
import { Button } from "@/ticketing/components/common/ui/button";
import { Card } from "@/ticketing/components/common/ui/card";
import { env } from "@/utils/ticketing/env";

export default function TokenRequired() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <Card className="w-full max-w-lg p-8 space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-primary font-semibold">DAN-ZZAN Operations</p>
          <h1 className="text-2xl font-semibold text-foreground">접근 토큰이 필요합니다</h1>
          <p className="text-sm text-muted-foreground">
            현재 모드는 <span className="font-semibold">{env.apiMode.toUpperCase()}</span>입니다.
            라이브 모드에서는 관리자 토큰이 있어야 팔찌 배부 화면에 접근할 수 있습니다.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/60 p-4 text-sm text-muted-foreground space-y-2">
          <p>개발 중이라면 아래 중 하나를 선택하세요.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>.env.development에서 VITE_API_MODE=mock 설정</li>
            <li>DEV 토큰을 설정한 뒤 다시 접속</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={() => navigate("/ticket/admin/login")}>관리자 로그인</Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate("/ticket/admin")}>관리 시스템 선택</Button>
        </div>
      </Card>
    </div>
  );
}
