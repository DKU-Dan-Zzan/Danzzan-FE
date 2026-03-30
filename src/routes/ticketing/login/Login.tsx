// 역할: 티켓팅 사용자 로그인 화면에서 자격 증명 제출과 오류 표시를 처리합니다.
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CircleAlert, Eye, EyeOff, GraduationCap } from "lucide-react";
import { HttpError } from "@/api/ticketing/httpClient";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import { useAuth } from "@/hooks/ticketing/useAuth";
import { TICKETING_AUTH_INPUT_CLASS_NAME } from "@/lib/ticketing/authInputClassNames";
import { resolveTicketingLoginRedirect } from "@/lib/ticketing/navigation/auth-navigation";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = studentId.trim().length > 0 && password.trim().length > 0;

  const redirect = resolveTicketingLoginRedirect(searchParams.get("redirect"));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ studentId, password }, "student");
      navigate(redirect);
    } catch (err) {
      if (err instanceof HttpError) {
        const payload = err.payload as { error?: string; message?: string } | undefined;
        const message = payload?.error ?? payload?.message;

        if (err.status === 401) {
          setError(message || "학번 또는 비밀번호가 올바르지 않습니다.");
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
    <div className="min-h-screen bg-[var(--webapp-main-bg)]">
      <div className="mx-auto w-full max-w-[var(--ticketing-mobile-shell-max-width)] bg-[var(--webapp-main-bg)] px-5 pb-6 sm:px-6">
        <section className="pb-3 pt-4">
          <p className="text-[11px] font-semibold text-[var(--text-muted)]">
            재학생 전용 축제 포털 서비스
          </p>
          <h1 className="mt-1 text-[20px] font-extrabold tracking-tight text-[var(--text-bold-emphasis)]">
            축제 포털 로그인
          </h1>
        </section>

        <main className="mt-3">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <section className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="studentId" className="text-sm font-semibold text-[var(--text)]">
                  학번
                </Label>
                <Input
                  id="studentId"
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  placeholder="학번 8자리를 입력해 주세요"
                  className={TICKETING_AUTH_INPUT_CLASS_NAME}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold text-[var(--text)]">
                  축제 포털 비밀번호
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="축제 포털용 비밀번호를 입력해 주세요"
                    className={`${TICKETING_AUTH_INPUT_CLASS_NAME} pr-11`}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-subtle)]"
                    aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                    title={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPassword ? (
                      <Eye className="h-4 w-4" strokeWidth={2.2} />
                    ) : (
                      <EyeOff className="h-4 w-4" strokeWidth={2.2} />
                    )}
                  </button>
                </div>
              </div>

              <p className="flex items-start gap-1.5 text-[11px] font-medium leading-5 text-[var(--text-muted)]">
                <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.3} />
                가입한 축제 포털 계정 비밀번호를 입력해 주세요.
              </p>
            </section>

            {error && (
              <p className="rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-text)]">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="h-11 w-full rounded-2xl border border-transparent bg-[linear-gradient(145deg,var(--ticketing-action-bg-start)_0%,var(--ticketing-action-bg-end)_100%)] text-white shadow-[var(--ticketing-action-shadow)] transition-all duration-200 hover:translate-y-[-1px] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:translate-y-0 disabled:border-[var(--ticketing-action-disabled-border)] disabled:bg-[linear-gradient(145deg,var(--ticketing-action-disabled-bg-start)_0%,var(--ticketing-action-disabled-bg-end)_100%)] disabled:text-[var(--ticketing-action-disabled-text)] disabled:shadow-none disabled:opacity-100"
              disabled={submitting || !canSubmit}
            >
              <GraduationCap className="h-4 w-4" strokeWidth={2.3} />
              {submitting ? "로그인 중..." : "축제 포털 계정으로 로그인"}
            </Button>
          </form>

          <div className="mt-5 space-y-2.5 text-center">
            <Link
              to="/ticket/signup"
              state={{ authTabFrom: "login" }}
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
            >
              <span>축제 포털을 처음 이용하시나요?</span>
              <span className="font-semibold text-[var(--text-emphasis-vivid)]">회원가입</span>
            </Link>

            <Link
              to="/ticket/reset-password"
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
            >
              <span>비밀번호를 잊으셨나요?</span>
              <span className="font-semibold text-[var(--text-emphasis-vivid)]">비밀번호 재설정</span>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
