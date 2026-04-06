import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleAlert, KeyRound } from "lucide-react";
import { Button } from "@/components/common/ui/button";
import { Checkbox } from "@/components/common/ui/checkbox";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import { PasswordPolicyChecklist } from "@/components/ticketing/auth/PasswordPolicyChecklist";
import {
  TicketingAuthHeading,
  TICKETING_AUTH_HEADER_SECTION_CLASS,
  TICKETING_AUTH_MAIN_CLASS,
} from "@/components/ticketing/auth/TicketingAuthHeading";
import { signupApi } from "@/api/ticketing/signupApi";
import { HttpError } from "@/api/ticketing/httpClient";
import {
  getPasswordPolicyState,
  getPasswordPolicyErrorMessage,
  isPasswordPolicyErrorMessage,
} from "@/lib/ticketing/passwordPolicy";
import { TICKETING_AUTH_INPUT_CLASS_NAME } from "@/lib/ticketing/authInputClassNames";
import { APP_CARD_VARIANTS } from "@/components/common/ui/appCardVariants";
import { cn } from "@/components/common/ui/utils";

const PAGE_TITLE = "축제 서비스 회원가입";
const EYEBROW = "2026 LOU:D X DANZZAN";
const STUDENT_ID_LABEL = "학번";
const STUDENT_ID_PLACEHOLDER = "학번 8자리를 입력해 주세요";
const DKU_PASSWORD_LABEL = "포털 비밀번호";
const DKU_PASSWORD_PLACEHOLDER = "단국대 포털 비밀번호를 입력해 주세요";
const SERVICE_PASSWORD_LABEL = "축제 서비스 비밀번호";
const SERVICE_PASSWORD_PLACEHOLDER = "새로운 비밀번호를 입력해 주세요";
const SERVICE_PASSWORD_CONFIRM_LABEL = "축제 서비스 비밀번호 확인";
const SERVICE_PASSWORD_CONFIRM_PLACEHOLDER =
  "새로운 비밀번호를 다시 입력해 주세요";
const STUDENT_VERIFY_HELP =
  "학생 인증을 위해 1회성으로만 사용하며 저장되지 않습니다.";
const PRIVACY_TITLE = "개인정보 이용 동의 (필수)";
const PRIVACY_BODY =
  "축제 서비스 및 대학 서비스 이용을 위해 학번, 연락처, 학적정보, 소속 등 최소 항목 정보의 수집 및 이용에 동의합니다.";
const SUBMIT_IDLE = "학생 인증 및 서비스 시작";
const SUBMIT_LOADING = "처리 중...";
const LOGIN_PROMPT = "이미 계정이 있으신가요?";
const LOGIN_ACTION = "로그인하러 가기";
const ERROR_REQUIRED_PORTAL =
  "학번과 단국대 포털 비밀번호를 입력해 주세요.";
const ERROR_REQUIRED_SERVICE_PASSWORD =
  "축제 서비스 전용 비밀번호를 입력해 주세요.";
const ERROR_PRIVACY_REQUIRED =
  "개인정보 이용 동의(필수)를 체크해주세요.";
const LOADING_VERIFY = "단국대 포털 인증 중...";
const LOADING_CREATE = "계정 생성 중...";
const ERROR_401 =
  "단국대 포털 학번 또는 비밀번호가 올바르지 않습니다.";
const ERROR_409 = "이미 가입한 학번입니다.";
const ERROR_403 = "학생 및 재학생만 회원가입이 가능합니다.";
const ERROR_SIGNUP = "회원가입에 실패했습니다.";
const AUTH_PLACEHOLDER_CLASS =
  "text-[0.96rem] sm:text-[0.98rem] placeholder:text-[0.8rem] sm:placeholder:text-[0.84rem] placeholder:tracking-[-0.01em]";

export default function Signup() {
  const navigate = useNavigate();
  const [dkuStudentId, setDkuStudentId] = useState("");
  const [dkuPassword, setDkuPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const passwordPolicy = getPasswordPolicyState(password, passwordConfirm);

  const clearPasswordPolicyError = () => {
    if (isPasswordPolicyErrorMessage(error)) {
      setError(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!dkuStudentId.trim() || !dkuPassword.trim()) {
      setError(ERROR_REQUIRED_PORTAL);
      return;
    }

    if (!password || !passwordConfirm) {
      setError(ERROR_REQUIRED_SERVICE_PASSWORD);
      return;
    }

    const passwordPolicyError = getPasswordPolicyErrorMessage(passwordPolicy);
    if (passwordPolicyError) {
      setError(passwordPolicyError);
      return;
    }

    if (!privacyConsent) {
      setError(ERROR_PRIVACY_REQUIRED);
      return;
    }

    setSubmitting(true);

    try {
      setLoadingMessage(LOADING_VERIFY);
      const { signupToken } = await signupApi.verifyStudent(dkuStudentId, dkuPassword);

      setLoadingMessage(LOADING_CREATE);
      await signupApi.completeSignup(signupToken, password, passwordConfirm);

      navigate("/ticket/login");
    } catch (err) {
      if (err instanceof HttpError) {
        const payload = err.payload as { error?: string } | undefined;
        const message = payload?.error;

        if (err.status === 401) {
          setError(message || ERROR_401);
        } else if (err.status === 409) {
          setError(message || ERROR_409);
        } else if (err.status === 403) {
          setError(message || ERROR_403);
        } else {
          setError(message || ERROR_SIGNUP);
        }
      } else {
        setError(ERROR_SIGNUP);
      }
    } finally {
      setSubmitting(false);
      setLoadingMessage("");
    }
  };

  return (
    <div className="relative left-1/2 min-h-screen w-screen -translate-x-1/2 overflow-hidden bg-[var(--bg-page-soft)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-[color:color-mix(in_srgb,var(--primary_container)_62%,white)] opacity-80 blur-3xl" />
        <div className="absolute right-[-5rem] top-1/4 h-72 w-72 rounded-full bg-[color:color-mix(in_srgb,var(--primary)_22%,white)] opacity-90 blur-3xl" />
        <div className="absolute bottom-[-4rem] left-1/4 h-64 w-64 rounded-full bg-[color:color-mix(in_srgb,var(--tertiary_container)_32%,white)] opacity-70 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[var(--ticketing-mobile-shell-max-width)] px-5 pb-8 pt-[calc(env(safe-area-inset-top)+5.25rem)] sm:px-6">
        <div className="w-full rounded-[30px] bg-[color:color-mix(in_srgb,var(--surface)_74%,transparent)] p-1 shadow-[0_20px_50px_rgba(44,52,54,0.06)] backdrop-blur-[24px]">
          <div className="rounded-[26px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface_container_low)_92%,white)_0%,color-mix(in_srgb,var(--surface_container_lowest)_96%,white)_100%)] px-5 py-6">
            <section className={TICKETING_AUTH_HEADER_SECTION_CLASS}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-emphasis-vivid)]">
                {EYEBROW}
              </p>
              <TicketingAuthHeading title={PAGE_TITLE} />
            </section>

            <main className={TICKETING_AUTH_MAIN_CLASS}>
              <div className="rounded-[24px] bg-[var(--surface_container_lowest)] px-4 py-4 shadow-[0_12px_30px_rgba(44,52,54,0.04)]">
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <section className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dkuStudentId" className="text-sm font-semibold text-[var(--text)]">
                        {STUDENT_ID_LABEL}
                      </Label>
                      <Input
                        id="dkuStudentId"
                        value={dkuStudentId}
                        onChange={(event) => setDkuStudentId(event.target.value)}
                        placeholder={STUDENT_ID_PLACEHOLDER}
                        className={cn(TICKETING_AUTH_INPUT_CLASS_NAME, AUTH_PLACEHOLDER_CLASS)}
                        required
                        disabled={submitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dkuPassword" className="text-sm font-semibold text-[var(--text)]">
                        {DKU_PASSWORD_LABEL}
                      </Label>
                      <Input
                        id="dkuPassword"
                        type="password"
                        value={dkuPassword}
                        onChange={(event) => setDkuPassword(event.target.value)}
                        placeholder={DKU_PASSWORD_PLACEHOLDER}
                        className={cn(TICKETING_AUTH_INPUT_CLASS_NAME, AUTH_PLACEHOLDER_CLASS)}
                        required
                        disabled={submitting}
                      />
                    </div>

                    <p className="flex items-start gap-1.5 rounded-[20px] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface_container_low)_86%,white)_0%,color-mix(in_srgb,var(--primary_container)_18%,white)_100%)] px-3 py-2.5 text-[11px] font-medium leading-5 text-[var(--text-muted)]">
                      <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-emphasis-vivid)]" strokeWidth={2.3} />
                      {STUDENT_VERIFY_HELP}
                    </p>
                  </section>

                  <div className="h-px bg-[linear-gradient(90deg,transparent_0%,color-mix(in_srgb,var(--primary)_18%,white)_18%,color-mix(in_srgb,var(--primary)_18%,white)_82%,transparent_100%)]" />

                  <section className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-semibold text-[var(--text)]">
                        {SERVICE_PASSWORD_LABEL}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => {
                          clearPasswordPolicyError();
                          setPassword(event.target.value);
                        }}
                        placeholder={SERVICE_PASSWORD_PLACEHOLDER}
                        className={cn(TICKETING_AUTH_INPUT_CLASS_NAME, AUTH_PLACEHOLDER_CLASS)}
                        autoComplete="new-password"
                        required
                        disabled={submitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passwordConfirm" className="text-sm font-semibold text-[var(--text)]">
                        {SERVICE_PASSWORD_CONFIRM_LABEL}
                      </Label>
                      <Input
                        id="passwordConfirm"
                        type="password"
                        value={passwordConfirm}
                        onChange={(event) => {
                          clearPasswordPolicyError();
                          setPasswordConfirm(event.target.value);
                        }}
                        placeholder={SERVICE_PASSWORD_CONFIRM_PLACEHOLDER}
                        className={cn(TICKETING_AUTH_INPUT_CLASS_NAME, AUTH_PLACEHOLDER_CLASS)}
                        autoComplete="new-password"
                        required
                        disabled={submitting}
                      />
                    </div>

                    <PasswordPolicyChecklist state={passwordPolicy} />
                  </section>

                  {error && (
                    <p className="rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-text)]">
                      {error}
                    </p>
                  )}

                  <section className={cn("rounded-2xl px-4 py-4", APP_CARD_VARIANTS.gradTint)}>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="privacyConsent"
                        checked={privacyConsent}
                        onCheckedChange={(checked) => setPrivacyConsent(checked === true)}
                        disabled={submitting}
                        className="mt-0.5 size-6 rounded-full border-[var(--border-base)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:bg-[var(--accent)]"
                      />
                      <div>
                        <Label
                          htmlFor="privacyConsent"
                          className="cursor-pointer text-base font-semibold text-[var(--text)]"
                        >
                          {PRIVACY_TITLE}
                        </Label>
                        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{PRIVACY_BODY}</p>
                      </div>
                    </div>
                  </section>

                  <Button
                    type="submit"
                    className="h-11 w-full rounded-2xl border border-transparent bg-[linear-gradient(145deg,var(--ticketing-action-bg-start)_0%,var(--ticketing-action-bg-end)_100%)] text-white shadow-[var(--ticketing-action-shadow)] transition-all duration-200 hover:translate-y-[-1px] hover:brightness-95 disabled:translate-y-0 disabled:border-[var(--ticketing-action-disabled-border)] disabled:bg-[linear-gradient(145deg,var(--ticketing-action-disabled-bg-start)_0%,var(--ticketing-action-disabled-bg-end)_100%)] disabled:text-[var(--ticketing-action-disabled-text)] disabled:shadow-none disabled:opacity-100"
                    disabled={submitting}
                  >
                    <KeyRound className="h-4 w-4" strokeWidth={2.3} />
                    {submitting ? loadingMessage || SUBMIT_LOADING : SUBMIT_IDLE}
                  </Button>
                </form>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-[var(--text-muted)]">{LOGIN_PROMPT}</p>
                <Link
                  to="/ticket/login"
                  state={{ authTabFrom: "signup" }}
                  className="mt-2 inline-block text-sm font-semibold text-[var(--text-emphasis-vivid)]"
                >
                  {LOGIN_ACTION}
                </Link>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
