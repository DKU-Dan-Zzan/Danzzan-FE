import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CircleAlert, Eye, EyeOff, GraduationCap } from "lucide-react";
import { HttpError } from "@/api/ticketing/httpClient";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import {
  TicketingAuthHeading,
  TICKETING_AUTH_HEADER_SECTION_CLASS,
  TICKETING_AUTH_MAIN_CLASS,
} from "@/components/ticketing/auth/TicketingAuthHeading";
import { useAuth } from "@/hooks/ticketing/useAuth";
import { TICKETING_AUTH_INPUT_CLASS_NAME } from "@/lib/ticketing/authInputClassNames";
import { resolveTicketingLoginRedirect } from "@/lib/ticketing/navigation/auth-navigation";
import { cn } from "@/components/common/ui/utils";

const LOGIN_TITLE = "축제 서비스 로그인";
const STUDENT_ID_LABEL = "학번";
const STUDENT_ID_PLACEHOLDER = "학번 8자리를 입력해 주세요";
const PASSWORD_LABEL = "축제 서비스 비밀번호";
const PASSWORD_PLACEHOLDER = "축제 서비스 비밀번호를 입력해 주세요";
const LOGIN_HELP =
  "가입한 축제 서비스 계정 비밀번호를 입력해 주세요.";
const LOGIN_ERROR_DEFAULT = "로그인에 실패했습니다.";
const LOGIN_ERROR_UNAUTHORIZED =
  "학번 또는 비밀번호가 올바르지 않습니다.";
const LOGIN_PENDING = "로그인 중...";
const LOGIN_ACTION =
  "축제 서비스 계정으로 로그인";
const SHOW_PASSWORD = "비밀번호 보기";
const HIDE_PASSWORD = "비밀번호 숨기기";
const SIGNUP_PROMPT = "축제 서비스가 처음 이용이신가요?";
const SIGNUP_ACTION = "회원가입";
const RESET_PROMPT = "비밀번호를 잊으셨나요?";
const RESET_ACTION = "비밀번호 재설정";
const FESTIVAL_EYEBROW = "2026 DANZZAN FESTIVAL";

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
        setError(err.status === 401 ? message || LOGIN_ERROR_UNAUTHORIZED : message || LOGIN_ERROR_DEFAULT);
      } else {
        setError(err instanceof Error ? err.message : LOGIN_ERROR_DEFAULT);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-page-soft)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-[color:color-mix(in_srgb,var(--primary_container)_62%,white)] opacity-80 blur-3xl" />
        <div className="absolute right-[-5rem] top-1/4 h-72 w-72 rounded-full bg-[color:color-mix(in_srgb,var(--primary)_22%,white)] opacity-90 blur-3xl" />
        <div className="absolute bottom-[-4rem] left-1/4 h-64 w-64 rounded-full bg-[color:color-mix(in_srgb,var(--tertiary_container)_32%,white)] opacity-70 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[var(--ticketing-mobile-shell-max-width)] px-5 pb-8 pt-6 sm:px-6">
        <div className="rounded-[30px] bg-[color:color-mix(in_srgb,var(--surface)_74%,transparent)] p-1 shadow-[0_20px_50px_rgba(44,52,54,0.06)] backdrop-blur-[24px]">
          <div className="rounded-[26px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface_container_low)_92%,white)_0%,color-mix(in_srgb,var(--surface_container_lowest)_96%,white)_100%)] px-5 py-6">
            <section className={TICKETING_AUTH_HEADER_SECTION_CLASS}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-emphasis-vivid)]">
                {FESTIVAL_EYEBROW}
              </p>
              <TicketingAuthHeading title={LOGIN_TITLE} />
            </section>

            <main className={TICKETING_AUTH_MAIN_CLASS}>
              <div className="rounded-[24px] bg-[var(--surface_container_lowest)] px-4 py-4 shadow-[0_12px_30px_rgba(44,52,54,0.04)]">
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <section className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="studentId" className="text-sm font-semibold text-[var(--text)]">
                        {STUDENT_ID_LABEL}
                      </Label>
                      <Input
                        id="studentId"
                        value={studentId}
                        onChange={(event) => setStudentId(event.target.value)}
                        placeholder={STUDENT_ID_PLACEHOLDER}
                        className={TICKETING_AUTH_INPUT_CLASS_NAME}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-sm font-semibold text-[var(--text)]">
                        {PASSWORD_LABEL}
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder={PASSWORD_PLACEHOLDER}
                          className={cn(TICKETING_AUTH_INPUT_CLASS_NAME, "pr-11")}
                          autoComplete="current-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface_container_lowest)]"
                          aria-label={showPassword ? HIDE_PASSWORD : SHOW_PASSWORD}
                          title={showPassword ? HIDE_PASSWORD : SHOW_PASSWORD}
                        >
                          {showPassword ? (
                            <Eye className="h-4 w-4" strokeWidth={2.2} />
                          ) : (
                            <EyeOff className="h-4 w-4" strokeWidth={2.2} />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="flex items-start gap-1.5 rounded-[20px] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface_container_low)_86%,white)_0%,color-mix(in_srgb,var(--primary_container)_18%,white)_100%)] px-3 py-2.5 text-[11px] font-medium leading-5 text-[var(--text-muted)]">
                      <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-emphasis-vivid)]" strokeWidth={2.3} />
                      {LOGIN_HELP}
                    </p>
                  </section>

                  {error && (
                    <p className="rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-text)]">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="h-11 w-full rounded-2xl border border-transparent bg-[linear-gradient(145deg,var(--ticketing-action-bg-start)_0%,var(--ticketing-action-bg-end)_100%)] text-white shadow-[var(--ticketing-action-shadow)] transition-all duration-200 hover:translate-y-[-1px] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface_container_lowest)] disabled:translate-y-0 disabled:border-[var(--ticketing-action-disabled-border)] disabled:bg-[linear-gradient(145deg,var(--ticketing-action-disabled-bg-start)_0%,var(--ticketing-action-disabled-bg-end)_100%)] disabled:text-[var(--ticketing-action-disabled-text)] disabled:shadow-none disabled:opacity-100"
                    disabled={submitting || !canSubmit}
                  >
                    <GraduationCap className="h-4 w-4" strokeWidth={2.3} />
                    {submitting ? LOGIN_PENDING : LOGIN_ACTION}
                  </Button>
                </form>
              </div>

              <div className="mt-5 space-y-2.5 text-center">
                <Link
                  to="/ticket/signup"
                  state={{ authTabFrom: "login" }}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
                >
                  <span>{SIGNUP_PROMPT}</span>
                  <span className="font-semibold text-[var(--text-emphasis-vivid)]">{SIGNUP_ACTION}</span>
                </Link>

                <Link
                  to="/ticket/reset-password"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
                >
                  <span>{RESET_PROMPT}</span>
                  <span className="font-semibold text-[var(--text-emphasis-vivid)]">{RESET_ACTION}</span>
                </Link>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
