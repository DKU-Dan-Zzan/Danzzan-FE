import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ticketing/common/ui/button";
import { Card } from "@/components/ticketing/common/ui/card";
import { Input } from "@/components/ticketing/common/ui/input";
import { Label } from "@/components/ticketing/common/ui/label";
import { useAuth } from "@/hooks/ticketing/useAuth";
import { resolveScopedRedirect } from "@/routes/common/authGuard";

export default function AdminLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const redirect = resolveScopedRedirect(searchParams.get("redirect"), {
    scope: "/ticket/admin",
    fallback: "/ticket/admin/wristband",
  });
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ studentId, password }, "admin");
      navigate(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--admin-auth-page-bg)] px-4 py-10">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col items-center">
        <div className="space-y-2 text-center">
          <p className="text-3xl font-bold tracking-tight text-[var(--admin-auth-brand-text)]">DAN-ZZAN</p>
          <p className="text-sm text-[var(--admin-auth-subtext)]">Wristband Operations Admin System</p>
        </div>

        <Card className="mt-8 w-full max-w-[620px] border-[var(--admin-auth-card-border)] bg-[var(--admin-auth-card-bg)] shadow-[var(--admin-auth-card-shadow)]">
          <div className="w-full p-8">
            <div className="space-y-2">
              <p className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--admin-auth-pill-bg)] px-3 py-1 text-xs font-semibold text-[var(--admin-auth-pill-text)]">
                <Ticket className="h-3.5 w-3.5" />
                팔찌 배부 운영 시스템
              </p>
              <h1 className="text-xl font-semibold text-foreground">팔찌 배부 운영 시스템 로그인</h1>
              <p className="text-sm text-[var(--admin-auth-subtext)]">
                운영자 계정으로 로그인하여 현장 배부를 관리하세요.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="studentId">관리자 학번</Label>
                <Input
                  id="studentId"
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  placeholder="학번을 입력하세요"
                  className="border-[var(--admin-panel-border)] bg-[var(--admin-auth-input-bg)]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">관리자 비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="border-[var(--admin-panel-border)] bg-[var(--admin-auth-input-bg)]"
                  required
                />
              </div>

              {error && <p className="text-sm text-[var(--admin-alert-error-text)]">{error}</p>}

              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "로그인 중..." : "팔찌 배부 시스템 로그인"}
              </Button>
            </form>
          </div>
        </Card>

        <p className="mt-6 text-center text-xs text-[var(--admin-auth-subtext)]">
          본 시스템은 총학생회 및 운영진 전용 내부 관리 도구입니다.
        </p>
      </div>
    </div>
  );
}
