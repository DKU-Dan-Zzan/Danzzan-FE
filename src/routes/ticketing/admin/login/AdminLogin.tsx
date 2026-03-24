// 역할: 티켓팅 관리자 로그인 입력/검증/제출 플로우를 처리합니다.
import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  TimerReset,
} from "lucide-react";
import { HttpError } from "@/api/ticketing/httpClient";
import { Button } from "@/components/common/ui/button";
import { Card } from "@/components/common/ui/card";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import { ADMIN_LOGIN_TITLE_CLASS } from "@/lib/common/adminLoginHeadingStyles";
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = studentId.trim().length > 0 && password.trim().length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ studentId, password }, "admin");
      navigate(redirect);
    } catch (err) {
      if (err instanceof HttpError) {
        const payload = err.payload as { error?: string; message?: string } | undefined;
        const message = payload?.error ?? payload?.message;

        if (err.status === 401) {
          setError(message || "관리자 학번 또는 비밀번호가 올바르지 않습니다.");
        } else {
          setError(message || "로그인에 실패했습니다.");
        }
      } else {
        setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-base)] px-4 py-8 md:px-8 md:py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-20 h-72 w-72 rounded-full bg-[var(--surface-tint-strong)] blur-3xl" />
        <div className="absolute right-[-120px] top-1/3 h-80 w-80 rounded-full bg-[var(--surface-tint-subtle)] blur-3xl" />
        <div className="absolute bottom-[-110px] left-1/3 h-72 w-72 rounded-full bg-[var(--surface-subtle)] blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[560px]">
        <Card className="rounded-[28px] border-[var(--admin-auth-card-border)] bg-[var(--admin-auth-card-bg)] shadow-[var(--admin-auth-card-shadow)] backdrop-blur-sm">
          <div className="space-y-7 px-6 py-7 md:px-8 md:py-9">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                2026 DANFESTA
              </p>
              <p className="text-sm font-semibold text-[var(--text-muted)]">
                관리자 전용
              </p>
              <h1 className={ADMIN_LOGIN_TITLE_CLASS}>
                팔찌 배부 운영 시스템
              </h1>
              <p className="text-sm text-[var(--admin-auth-subtext)]">
                관리자 계정 인증 후 현장 운영 페이지로 이동합니다.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-sm font-semibold text-[var(--text)]">
                  관리자 학번
                </Label>
                <Input
                  id="studentId"
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  placeholder="학번을 입력하세요"
                  inputMode="numeric"
                  autoComplete="username"
                  className="h-11 rounded-xl border-[var(--admin-panel-border)] bg-[var(--admin-auth-input-bg)]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-[var(--text)]">
                  관리자 비밀번호
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    autoComplete="current-password"
                    className="h-11 rounded-xl border-[var(--admin-panel-border)] bg-[var(--admin-auth-input-bg)] pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
                    aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" strokeWidth={2.2} />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={2.2} />
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--admin-auth-help-border)] bg-[var(--admin-auth-help-bg)] px-3 py-2.5">
                <p className="flex items-start gap-2 text-xs font-medium leading-5 text-[var(--admin-auth-help-text)]">
                  <TimerReset className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  운영진 전용 인증 화면입니다. 권한 없는 계정은 접근할 수 없습니다.
                </p>
              </div>

              {error && (
                <p className="flex items-start gap-2 rounded-xl border border-[var(--admin-alert-error-border)] bg-[var(--admin-alert-error-bg)] px-3 py-2 text-sm text-[var(--admin-alert-error-text)]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="h-11 w-full gap-2 rounded-xl text-sm font-semibold"
                disabled={submitting || !canSubmit}
              >
                <ShieldCheck className="h-4 w-4" strokeWidth={2.2} />
                {submitting ? "접속 중..." : "시스템 접속"}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
