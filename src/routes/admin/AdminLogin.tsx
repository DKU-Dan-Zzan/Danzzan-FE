import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { CircleAlert, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { ADMIN_AUTH_INPUT_CLASS_NAME } from "@/lib/common/authInputClassNames";
import { resolveScopedRedirect } from "@/routes/common/authGuard";
import { useAdminAuth } from "@/hooks/app/admin/useAdminAuth";
import { getAdminSession } from "@/lib/app/admin/admin-auth-session";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAdminAuth();
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redirect = resolveScopedRedirect(searchParams.get("redirect"), {
    scope: "/admin",
    fallback: "/admin",
  });

  if (getAdminSession()) {
    return <Navigate to={redirect} replace />;
  }

  const canSubmit = studentNumber.trim().length > 0 && password.trim().length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(studentNumber, password);
      navigate(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-page-soft)] px-4 py-8 md:px-8 md:py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-20 h-72 w-72 rounded-full bg-[var(--surface-tint-subtle)] blur-3xl" />
        <div className="absolute right-[-120px] top-1/3 h-80 w-80 rounded-full bg-[var(--surface-tint-subtle)] blur-3xl" />
        <div className="absolute bottom-[-110px] left-1/3 h-72 w-72 rounded-full bg-[var(--surface-subtle)] blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[560px]">
        <div className="rounded-[28px] border border-[var(--border-base)] bg-[var(--bg-base)] shadow-[0_16px_34px_rgba(15,23,42,0.08)]">
          <div className="space-y-7 px-6 py-7 md:px-8 md:py-9">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                2026 DANFESTA
              </p>
              <p className="text-sm font-semibold text-[var(--text-muted)]">
                관리자 전용
              </p>
              <h1 className="text-[30px] font-black leading-tight tracking-[-0.02em] text-[var(--text)] md:text-[34px]">
                공지사항/광고 업로드 시스템
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                관리자 계정 인증 후 공지 및 배너 관리 페이지로 이동합니다.
              </p>
            </div>

            <main>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <section className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="studentNumber"
                      className="block text-sm font-semibold text-[var(--text)]"
                    >
                      관리자 학번
                    </label>
                    <input
                      id="studentNumber"
                      type="text"
                      inputMode="numeric"
                      value={studentNumber}
                      onChange={(e) => setStudentNumber(e.target.value)}
                      placeholder="학번을 입력하세요"
                      className={ADMIN_AUTH_INPUT_CLASS_NAME}
                      required
                      autoComplete="username"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-[var(--text)]"
                    >
                      관리자 비밀번호
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호를 입력하세요"
                        className={`${ADMIN_AUTH_INPUT_CLASS_NAME} pr-12`}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
                        aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" strokeWidth={2.3} />
                        ) : (
                          <Eye className="h-4 w-4" strokeWidth={2.3} />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="flex items-start gap-1.5 rounded-xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 py-2.5 text-xs font-medium leading-5 text-[var(--text-muted)]">
                    <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.3} />
                    운영진 전용 인증 화면입니다. 권한 없는 계정은 접근할 수 없습니다.
                  </p>
                </section>

                {error && (
                  <p className="rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-text)]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-white shadow-[0_10px_18px_-12px_var(--shadow-color)] transition-all duration-200 hover:-translate-y-px hover:brightness-95 disabled:translate-y-0 disabled:opacity-55"
                >
                  <ShieldCheck className="h-4 w-4" strokeWidth={2.3} />
                  {submitting ? "접속 중..." : "포털 접속"}
                </button>
              </form>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
