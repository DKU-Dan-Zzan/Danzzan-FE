// 역할: 관리자 토큰 미보유/만료 시 재인증 안내 화면을 제공합니다.
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/common/ui/button";
import { Card } from "@/components/common/ui/card";
import { env } from "@/utils/common/env";

type TokenRequiredProps = {
  loginRedirectPath?: string;
  returnTo?: string;
};

export default function TokenRequired({
  loginRedirectPath = "/ticket/admin/login",
  returnTo = "/ticket/admin",
}: TokenRequiredProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--admin-auth-page-bg)] px-6">
      <Card className="w-full max-w-lg space-y-4 border-[var(--admin-auth-card-border)] bg-[var(--admin-auth-card-bg)] p-8 shadow-[var(--admin-auth-card-shadow)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--admin-auth-brand-text)]">DAN-ZZAN Operations</p>
          <h1 className="text-2xl font-semibold text-foreground">접근 토큰이 필요합니다</h1>
          <p className="text-sm text-[var(--admin-auth-subtext)]">
            현재 모드는 <span className="font-semibold">{env.apiMode.toUpperCase()}</span>입니다.
            라이브 모드에서는 관리자 토큰이 있어야 팔찌 배부 화면에 접근할 수 있습니다.
          </p>
          <p className="text-xs text-[var(--admin-auth-subtext)]">
            요청 경로: {returnTo}
          </p>
        </div>

        <div className="space-y-2 rounded-lg border border-[var(--admin-auth-help-border)] bg-[var(--admin-auth-help-bg)] p-4 text-sm text-[var(--admin-auth-help-text)]">
          <p>개발 중이라면 아래 중 하나를 선택하세요.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>.env.development에서 VITE_API_MODE=mock 설정</li>
            <li>DEV 토큰을 설정한 뒤 다시 접속</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={() => navigate(loginRedirectPath)}>관리자 로그인</Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate("/ticket/admin")}>관리 시스템 선택</Button>
        </div>
      </Card>
    </div>
  );
}
