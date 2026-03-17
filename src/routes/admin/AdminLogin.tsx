import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { CircleAlert, Eye, EyeOff, House, ShieldCheck } from "lucide-react";
import { ADMIN_AUTH_INPUT_CLASS_NAME } from "@/lib/ticketing/authInputClassNames";
import { getAdminSession, useAdminAuth } from "../../hooks/useAdminAuth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAdminAuth();
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redirect = searchParams.get("redirect") || "/admin";

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
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto w-full max-w-[420px] px-5 py-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]"
        >
          <House className="h-4 w-4" strokeWidth={2.3} />
          메인으로
        </Link>

        <div className="mt-9">
          <p className="text-sm font-semibold text-[var(--text-muted)]">
            관리자 전용
          </p>
          <h1 className="mt-1 text-2xl font-black leading-tight tracking-tight text-[var(--text)]">
            공지사항/분실물 관리자 로그인
          </h1>
        </div>

        <main className="mt-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <section className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="studentNumber"
                  className="block text-sm font-semibold text-[var(--text)]"
                >
                  학번
                </label>
                <input
                  id="studentNumber"
                  type="text"
                  inputMode="numeric"
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  placeholder="관리자 ID를 입력해 주세요"
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
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력해 주세요"
                    className={`${ADMIN_AUTH_INPUT_CLASS_NAME} pr-12`}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
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

              <p className="flex items-start gap-1.5 text-[11px] font-medium leading-5 text-[var(--text-muted)]">
                <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.3} />
                관리자 계정으로만 로그인할 수 있습니다.
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
              {submitting ? "로그인 중..." : "관리자 로그인"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
