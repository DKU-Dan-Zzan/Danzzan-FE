import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CircleAlert, Clock3, KeyRound, MailCheck, RotateCcw } from "lucide-react";
import { HttpError } from "@/api/ticketing/httpClient";
import { passwordResetApi } from "@/api/ticketing/passwordResetApi";
import { PasswordPolicyChecklist } from "@/components/ticketing/auth/PasswordPolicyChecklist";
import { Button } from "@/components/ticketing/common/ui/button";
import { Input } from "@/components/ticketing/common/ui/input";
import { Label } from "@/components/ticketing/common/ui/label";
import {
  getPasswordPolicyErrorMessage,
  getPasswordPolicyState,
  isPasswordPolicyErrorMessage,
} from "@/lib/ticketing/passwordPolicy";

type ResetStep = "request" | "verify" | "password";
type ResetStepItem = {
  key: ResetStep;
  label: string;
};

const DEFAULT_TIMER_SECONDS = 180;
const STUDENT_ID_REGEX = /^\d{8}$/;
const VERIFICATION_CODE_REGEX = /^\d{6}$/;
const ERROR_CODE_MESSAGES: Record<string, string> = {
  PASSWORD_RESET_USER_NOT_FOUND: "등록되지 않은 학번입니다. 축제 포털에 가입된 학번을 입력해 주세요.",
  PASSWORD_RESET_RESEND_COOLDOWN: "잠시 후 인증번호를 다시 요청해 주세요.",
  PASSWORD_RESET_RATE_LIMITED: "요청 횟수 제한을 초과했습니다. 잠시 후 다시 시도해 주세요.",
  PASSWORD_RESET_TOO_MANY_ATTEMPTS: "인증 시도 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요.",
};
const RESET_STEPS: ResetStepItem[] = [
  { key: "request", label: "학번 입력" },
  { key: "verify", label: "인증번호 확인" },
  { key: "password", label: "새 비밀번호" },
];
const RESET_PASSWORD_STORAGE_KEY = "ticketing-reset-password-state-v1";
const RESET_PASSWORD_SESSION_ERROR_MESSAGE =
  "비밀번호 재설정 정보를 확인할 수 없습니다. 인증번호를 다시 요청해 주세요.";

type ResetPasswordPersistedState = {
  step?: ResetStep;
  studentId?: string;
  requestId?: string;
  verificationCode?: string;
  verificationToken?: string;
  timerExpiresAt?: number;
};

const sanitizeDigitInput = (value: string, maxLength: number) => value.replace(/\D/g, "").slice(0, maxLength);

const formatTimer = (seconds: number) => {
  const minute = Math.floor(seconds / 60);
  const second = seconds % 60;
  return `${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
};

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof HttpError) {
    const payload = error.payload as { error?: string; errorCode?: string; message?: string } | undefined;
    if (payload?.errorCode && ERROR_CODE_MESSAGES[payload.errorCode]) {
      return ERROR_CODE_MESSAGES[payload.errorCode];
    }
    if (payload?.error) {
      return payload.error;
    }
    if (payload?.message) {
      return payload.message;
    }
    if (typeof error.payload === "string" && error.payload.trim().length > 0) {
      return error.payload;
    }
  }
  return fallback;
};

const safeParsePersistedState = (raw: string | null): ResetPasswordPersistedState | null => {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ResetPasswordPersistedState;
  } catch {
    return null;
  }
};

const sanitizePersistedStep = (value?: string): ResetStep => {
  if (value === "verify" || value === "password") {
    return value;
  }
  return "request";
};

const hasResetSession = (requestId?: string, verificationToken?: string) =>
  Boolean(requestId?.trim() && verificationToken?.trim());

export default function ResetPassword() {
  const [step, setStep] = useState<ResetStep>("request");
  const [studentId, setStudentId] = useState("");
  const [requestId, setRequestId] = useState<string>();
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationToken, setVerificationToken] = useState<string>();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(DEFAULT_TIMER_SECONDS);
  const [timerExpiresAt, setTimerExpiresAt] = useState<number | null>(null);
  const [requestingCode, setRequestingCode] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputClassName =
    "h-11 rounded-2xl border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 placeholder:text-[var(--text-muted)] transition-all duration-200 focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]/20";

  const isStudentIdValid = STUDENT_ID_REGEX.test(studentId);
  const isVerificationCodeValid = VERIFICATION_CODE_REGEX.test(verificationCode);
  const passwordPolicy = getPasswordPolicyState(password, passwordConfirm);
  const isPasswordFormValid = passwordPolicy.isValid;
  const isCodeExpired = timerSecondsLeft <= 0;
  const isTimerRunning = step === "verify" && timerExpiresAt !== null && timerSecondsLeft > 0;
  const stepIndex = RESET_STEPS.findIndex(({ key }) => key === step) + 1;
  const currentStepLabel = RESET_STEPS[stepIndex - 1]?.label ?? RESET_STEPS[0].label;
  const clearPasswordPolicyError = () => {
    if (isPasswordPolicyErrorMessage(error)) {
      setError(null);
    }
  };

  const resetToRequestStep = (nextError?: string) => {
    sessionStorage.removeItem(RESET_PASSWORD_STORAGE_KEY);
    setStep("request");
    setRequestId(undefined);
    setVerificationCode("");
    setVerificationToken(undefined);
    setPassword("");
    setPasswordConfirm("");
    setTimerExpiresAt(null);
    setTimerSecondsLeft(DEFAULT_TIMER_SECONDS);
    if (nextError) {
      setError(nextError);
    }
  };

  useEffect(() => {
    const persisted = safeParsePersistedState(sessionStorage.getItem(RESET_PASSWORD_STORAGE_KEY));
    if (!persisted) {
      return;
    }

    const nextStep = sanitizePersistedStep(persisted.step);
    const nextStudentId = sanitizeDigitInput(persisted.studentId ?? "", 8);
    const nextVerificationCode = sanitizeDigitInput(persisted.verificationCode ?? "", 6);
    const nextExpiresAt = typeof persisted.timerExpiresAt === "number" ? persisted.timerExpiresAt : null;

    if (nextStudentId) {
      setStudentId(nextStudentId);
    }

    if (persisted.requestId) {
      setRequestId(persisted.requestId);
    }

    if (nextVerificationCode) {
      setVerificationCode(nextVerificationCode);
    }

    if (persisted.verificationToken) {
      setVerificationToken(persisted.verificationToken);
    }

    if (nextStep === "verify") {
      setStep("verify");
      if (nextExpiresAt !== null) {
        const left = Math.max(0, Math.ceil((nextExpiresAt - Date.now()) / 1000));
        setTimerExpiresAt(nextExpiresAt);
        setTimerSecondsLeft(left);
      } else {
        const fallbackExpiresAt = Date.now() + DEFAULT_TIMER_SECONDS * 1000;
        setTimerExpiresAt(fallbackExpiresAt);
        setTimerSecondsLeft(DEFAULT_TIMER_SECONDS);
      }
      return;
    }

    if (nextStep === "password") {
      if (!hasResetSession(persisted.requestId, persisted.verificationToken)) {
        resetToRequestStep(RESET_PASSWORD_SESSION_ERROR_MESSAGE);
        return;
      }

      setStep("password");
      setTimerExpiresAt(null);
      setTimerSecondsLeft(0);
    }
  }, []);

  useEffect(() => {
    if (!isTimerRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      if (timerExpiresAt === null) {
        setTimerSecondsLeft(0);
        return;
      }
      const left = Math.max(0, Math.ceil((timerExpiresAt - Date.now()) / 1000));
      setTimerSecondsLeft(left);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isTimerRunning, timerExpiresAt]);

  useEffect(() => {
    if (completed) {
      sessionStorage.removeItem(RESET_PASSWORD_STORAGE_KEY);
      return;
    }

    const payload: ResetPasswordPersistedState = {
      step,
      studentId,
      requestId,
      verificationCode,
      verificationToken,
      timerExpiresAt: step === "verify" ? timerExpiresAt ?? undefined : undefined,
    };

    const hasMeaningfulState = Boolean(
      payload.studentId ||
        payload.requestId ||
        payload.verificationCode ||
        payload.verificationToken ||
        payload.step !== "request",
    );

    if (!hasMeaningfulState) {
      sessionStorage.removeItem(RESET_PASSWORD_STORAGE_KEY);
      return;
    }

    sessionStorage.setItem(RESET_PASSWORD_STORAGE_KEY, JSON.stringify(payload));
  }, [completed, requestId, step, studentId, timerExpiresAt, verificationCode, verificationToken]);

  const moveToVerifyStep = (expiresInSec?: number, nextRequestId?: string) => {
    const expiresAt = Date.now() + (expiresInSec && expiresInSec > 0 ? expiresInSec : DEFAULT_TIMER_SECONDS) * 1000;
    setRequestId(nextRequestId);
    setVerificationCode("");
    setVerificationToken(undefined);
    setTimerExpiresAt(expiresAt);
    setTimerSecondsLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    setStep("verify");
  };

  const handleRequestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isStudentIdValid) {
      setError("학번은 8자리 숫자로 입력해 주세요.");
      return;
    }

    setError(null);
    setRequestingCode(true);

    try {
      const response = await passwordResetApi.requestCode(studentId);
      moveToVerifyStep(response.expiresInSec, response.requestId);
    } catch (requestError) {
      setError(resolveErrorMessage(requestError, "인증번호 요청에 실패했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      setRequestingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (!isStudentIdValid) {
      setError("학번이 유효하지 않습니다. 다시 확인해 주세요.");
      return;
    }

    setError(null);
    setResendingCode(true);

    try {
      const response = await passwordResetApi.requestCode(studentId);
      moveToVerifyStep(response.expiresInSec, response.requestId);
    } catch (requestError) {
      setError(resolveErrorMessage(requestError, "인증번호 재전송에 실패했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      setResendingCode(false);
    }
  };

  const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isCodeExpired) {
      setError("인증 시간이 만료되었습니다. 인증번호를 다시 요청해 주세요.");
      return;
    }

    if (!isVerificationCodeValid) {
      setError("인증번호는 6자리 숫자로 입력해 주세요.");
      return;
    }

    setError(null);
    setVerifyingCode(true);

    try {
      const response = await passwordResetApi.verifyCode({
        studentId,
        code: verificationCode,
        requestId,
      });
      setVerificationToken(response.verificationToken);
      setTimerExpiresAt(null);
      setStep("password");
    } catch (verifyError) {
      setError(resolveErrorMessage(verifyError, "인증번호 확인에 실패했습니다. 번호를 다시 확인해 주세요."));
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasResetSession(requestId, verificationToken)) {
      resetToRequestStep(RESET_PASSWORD_SESSION_ERROR_MESSAGE);
      return;
    }

    const passwordPolicyError = getPasswordPolicyErrorMessage(passwordPolicy);
    if (passwordPolicyError) {
      setError(passwordPolicyError);
      return;
    }

    setError(null);
    setResettingPassword(true);

    try {
      await passwordResetApi.resetPassword({
        requestId,
        verificationToken,
        newPassword: password,
        confirmPassword: passwordConfirm,
      });
      setCompleted(true);
    } catch (resetError) {
      setError(resolveErrorMessage(resetError, "비밀번호 재설정에 실패했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto w-full max-w-[420px] px-5 py-6">
        <div className="mt-9">
          <p className="text-[length:var(--ticketing-text-helper)] font-semibold text-[var(--text-muted)]">
            재학생 전용 티켓팅 서비스
          </p>
          <h1 className="mt-1 leading-[1.12] font-black tracking-tight text-[var(--text)]">
            비밀번호 재설정
          </h1>
        </div>

        <main className="mt-6">
          {!completed && (
            <div className="mb-6 rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 py-3">
              <p className="text-xs font-semibold text-[var(--text-muted)]">
                <span className="text-[var(--accent)]">{stepIndex}/3 단계</span> · {currentStepLabel}
              </p>

              <div className="mt-3" aria-label="비밀번호 재설정 단계">
                <div className="grid grid-cols-[2rem_1fr_2rem_1fr_2rem] items-center">
                  {RESET_STEPS.map(({ key }, index) => {
                    const current = index + 1;
                    const isActive = current === stepIndex;
                    const isDone = current < stepIndex;
                    const showConnector = index < RESET_STEPS.length - 1;
                    const connectorDone = stepIndex > current;

                    return (
                      <div key={key} className="contents">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-bold ${
                            isActive
                              ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                              : isDone
                                ? "border-[var(--border-strong)] bg-[var(--surface-tint-subtle)] text-[var(--accent)]"
                                : "border-[var(--border-base)] bg-[var(--surface-base)] text-[var(--text-muted)]"
                          }`}
                        >
                          {isDone ? "✓" : String(current).padStart(2, "0")}
                        </span>

                        {showConnector && (
                          <span
                            className={`mx-3 h-px w-full ${
                              connectorDone ? "bg-[var(--border-emphasis)]" : "bg-[var(--border-base)]"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-1.5 grid grid-cols-[2rem_1fr_2rem_1fr_2rem] items-start">
                  {RESET_STEPS.map(({ key, label }, index) => {
                    const current = index + 1;
                    const isActive = current === stepIndex;
                    const isDone = current < stepIndex;
                    const showSpacer = index < RESET_STEPS.length - 1;

                    return (
                      <div key={`${key}-label`} className="contents">
                        <p
                          className={`justify-self-center text-center text-[11px] leading-4 font-semibold whitespace-nowrap ${
                            isActive
                              ? "text-[var(--accent)]"
                              : isDone
                                ? "text-[var(--text)]"
                                : "text-[var(--text-muted)]"
                          }`}
                        >
                          {label}
                        </p>
                        {showSpacer && <span aria-hidden="true" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === "request" && !completed && (
            <form className="space-y-5" onSubmit={handleRequestCode}>
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-sm font-semibold text-[var(--text)]">
                  학번
                </Label>
                <Input
                  id="studentId"
                  value={studentId}
                  onChange={(event) => setStudentId(sanitizeDigitInput(event.target.value, 8))}
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="학번 8자리를 입력해 주세요"
                  className={inputClassName}
                  disabled={requestingCode}
                  required
                />
              </div>

              <p className="rounded-2xl border border-[var(--border-strong)] bg-[linear-gradient(145deg,var(--surface-tint-strong)_0%,var(--surface-base)_100%)] px-4 py-3 text-sm leading-6 text-[var(--text)]">
                축제 포털에 기존에 가입된 학생에게, 입력한 학번의 학교 이메일(학번@dankook.ac.kr)로 인증번호가 발송됩니다.
              </p>

              {error && (
                <p className="rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-text)]">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="h-11 w-full rounded-2xl bg-[var(--accent)] text-white shadow-[0_10px_18px_-12px_var(--shadow-color)] transition-all duration-200 hover:translate-y-[-1px] hover:brightness-95 disabled:translate-y-0 disabled:opacity-55"
                disabled={!isStudentIdValid || requestingCode}
              >
                <MailCheck className="h-4 w-4" strokeWidth={2.3} />
                {requestingCode ? "인증번호 요청 중..." : "인증번호 요청"}
              </Button>
            </form>
          )}

          {step === "verify" && !completed && (
            <form className="space-y-5" onSubmit={handleVerifyCode}>
              <div className="space-y-2">
                <Label htmlFor="verificationCode" className="text-sm font-semibold text-[var(--text)]">
                  인증번호
                </Label>
                <Input
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(sanitizeDigitInput(event.target.value, 6))}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="인증번호 6자리를 입력해 주세요"
                  className={inputClassName}
                  disabled={verifyingCode}
                  required
                />
              </div>

              <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--text)]">
                      학교 이메일(학번@dankook.ac.kr)로 인증번호가 전송됩니다.
                    </p>
                    <p className="text-xs leading-5 text-[var(--text-muted)]">
                      메일이 보이지 않으면 스팸함을 확인해 주세요.
                    </p>
                    <p className="text-xs leading-5 text-[var(--text-muted)]">
                      계정이 없다면 회원가입 후 이용해 주세요.
                    </p>
                  </div>
                  <p
                    className={`inline-flex items-center gap-1 text-sm font-semibold ${
                      isCodeExpired ? "text-[var(--status-danger-text)]" : "text-[var(--accent)]"
                    }`}
                  >
                    <Clock3 className="h-4 w-4" />
                    {formatTimer(timerSecondsLeft)}
                  </p>
                </div>
              </div>

              {isCodeExpired && (
                <p className="flex items-start gap-1.5 text-[11px] font-medium leading-5 text-[var(--status-danger-text)]">
                  <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.3} />
                  인증 시간이 만료되었습니다. 인증번호를 다시 요청해 주세요.
                </p>
              )}

              {error && (
                <p className="rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-text)]">
                  {error}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-2xl border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text)] hover:bg-[var(--surface-base)]"
                  onClick={handleResendCode}
                  disabled={resendingCode}
                >
                  <RotateCcw className="h-4 w-4" strokeWidth={2.3} />
                  {resendingCode ? "재전송 중..." : "인증번호 재전송"}
                </Button>
                <Button
                  type="submit"
                  className="h-11 rounded-2xl bg-[var(--accent)] text-white shadow-[0_10px_18px_-12px_var(--shadow-color)] transition-all duration-200 hover:translate-y-[-1px] hover:brightness-95 disabled:translate-y-0 disabled:opacity-55"
                  disabled={!isVerificationCodeValid || isCodeExpired || verifyingCode}
                >
                  <MailCheck className="h-4 w-4" strokeWidth={2.3} />
                  {verifyingCode ? "인증 확인 중..." : "인증번호 확인"}
                </Button>
              </div>
            </form>
          )}

          {step === "password" && !completed && (
            <form className="space-y-5" onSubmit={handleResetPassword}>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-[var(--text)]">
                  새 비밀번호
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    clearPasswordPolicyError();
                    setPassword(event.target.value);
                  }}
                  placeholder="새 비밀번호를 입력해 주세요"
                  className={inputClassName}
                  autoComplete="new-password"
                  disabled={resettingPassword}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm" className="text-sm font-semibold text-[var(--text)]">
                  새 비밀번호 확인
                </Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => {
                    clearPasswordPolicyError();
                    setPasswordConfirm(event.target.value);
                  }}
                  placeholder="새 비밀번호를 다시 입력해 주세요"
                  className={inputClassName}
                  autoComplete="new-password"
                  disabled={resettingPassword}
                  required
                />
              </div>

              <PasswordPolicyChecklist state={passwordPolicy} />

              {error && (
                <p className="rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-text)]">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="h-11 w-full rounded-2xl bg-[var(--accent)] text-white shadow-[0_10px_18px_-12px_var(--shadow-color)] transition-all duration-200 hover:translate-y-[-1px] hover:brightness-95 disabled:translate-y-0 disabled:opacity-55"
                disabled={!isPasswordFormValid || resettingPassword}
              >
                <KeyRound className="h-4 w-4" strokeWidth={2.3} />
                {resettingPassword ? "비밀번호 재설정 중..." : "새 비밀번호로 재설정"}
              </Button>
            </form>
          )}

          {completed && (
            <section className="space-y-5">
              <div className="rounded-2xl border border-[var(--border-strong)] bg-[linear-gradient(145deg,var(--surface-tint-strong)_0%,var(--surface-base)_100%)] px-4 py-5">
                <p className="text-sm font-semibold text-[var(--accent)]">비밀번호 재설정 완료</p>
                <p className="mt-1 text-sm leading-6 text-[var(--text)]">
                  비밀번호가 성공적으로 변경되었습니다. 새로운 비밀번호로 로그인해 주세요.
                </p>
              </div>

              <Button
                asChild
                className="h-11 w-full rounded-2xl bg-[var(--accent)] text-white shadow-[0_10px_18px_-12px_var(--shadow-color)] transition-all duration-200 hover:translate-y-[-1px] hover:brightness-95"
              >
                <Link to="/ticket/login">로그인 화면으로 이동</Link>
              </Button>
            </section>
          )}

          {!completed && (
            <div className="mt-6 text-center">
              <p className="text-sm text-[var(--text-muted)]">로그인 화면으로 돌아가시겠어요?</p>
              <Link to="/ticket/login" className="mt-2 inline-block text-sm font-semibold text-[var(--accent)]">
                로그인하러 가기
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
