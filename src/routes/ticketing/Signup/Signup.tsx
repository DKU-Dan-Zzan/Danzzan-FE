import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CircleAlert,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ticketing/common/ui/button";
import { Checkbox } from "@/components/ticketing/common/ui/checkbox";
import { Input } from "@/components/ticketing/common/ui/input";
import { Label } from "@/components/ticketing/common/ui/label";
import { PasswordPolicyChecklist } from "@/components/ticketing/auth/PasswordPolicyChecklist";
import { signupApi } from "@/api/ticketing/signupApi";
import { HttpError } from "@/api/ticketing/httpClient";
import {
  getPasswordPolicyState,
  getPasswordPolicyErrorMessage,
  isPasswordPolicyErrorMessage,
} from "@/lib/ticketing/passwordPolicy";
import { TICKETING_AUTH_INPUT_CLASS_NAME } from "@/lib/ticketing/authInputClassNames";

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
      setError("학번과 단국대학교 포털 비밀번호를 입력해 주세요.");
      return;
    }

    if (!password || !passwordConfirm) {
      setError("축제 포털 전용 비밀번호를 입력해 주세요.");
      return;
    }

    const passwordPolicyError = getPasswordPolicyErrorMessage(passwordPolicy);
    if (passwordPolicyError) {
      setError(passwordPolicyError);
      return;
    }

    if (!privacyConsent) {
      setError("개인정보 이용 동의(필수)에 체크해주세요.");
      return;
    }

    setSubmitting(true);

    try {
      setLoadingMessage("단국대 포털 인증 중...");
      const { signupToken } = await signupApi.verifyStudent(
        dkuStudentId,
        dkuPassword,
      );

      setLoadingMessage("계정 생성 중...");
      await signupApi.completeSignup(signupToken, password, passwordConfirm);

      navigate("/ticket/login");
    } catch (err) {
      if (err instanceof HttpError) {
        const payload = err.payload as { error?: string } | undefined;
        const message = payload?.error;

        if (err.status === 401) {
          setError(message || "단국대 포털 학번 또는 비밀번호가 올바르지 않습니다.");
        } else if (err.status === 409) {
          setError(message || "이미 가입된 학번입니다.");
        } else if (err.status === 403) {
          setError(message || "재학생만 회원가입이 가능합니다.");
        } else {
          setError(message || "회원가입에 실패했습니다.");
        }
      } else {
        setError("회원가입에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
      setLoadingMessage("");
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
            티켓팅 포털 회원가입
          </h1>
        </div>

        <main className="mt-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <section className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dkuStudentId" className="text-sm font-semibold text-[var(--text)]">
                  학번
                </Label>
                <Input
                  id="dkuStudentId"
                  value={dkuStudentId}
                  onChange={(event) => setDkuStudentId(event.target.value)}
                  placeholder="학번 8자리를 입력해 주세요"
                  className={TICKETING_AUTH_INPUT_CLASS_NAME}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dkuPassword" className="text-sm font-semibold text-[var(--text)]">
                  포털 비밀번호
                </Label>
                <Input
                  id="dkuPassword"
                  type="password"
                  value={dkuPassword}
                  onChange={(event) => setDkuPassword(event.target.value)}
                  placeholder="단국대 포털 비밀번호를 입력해 주세요"
                  className={TICKETING_AUTH_INPUT_CLASS_NAME}
                  required
                  disabled={submitting}
                />
              </div>

              <p className="flex items-start gap-1.5 text-[11px] font-medium leading-5 text-[var(--text-muted)]">
                <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.3} />
                재학생 인증을 위해 1회성으로만 사용되며 저장되지 않습니다.
              </p>
            </section>

            <div className="h-px bg-[var(--border-subtle)]" />

            <section className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-[var(--text)]">
                  축제 포털 비밀번호
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    clearPasswordPolicyError();
                    setPassword(event.target.value);
                  }}
                  placeholder="새로운 비밀번호를 입력해 주세요"
                  className={TICKETING_AUTH_INPUT_CLASS_NAME}
                  autoComplete="new-password"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm" className="text-sm font-semibold text-[var(--text)]">
                  축제 포털 비밀번호 확인
                </Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => {
                    clearPasswordPolicyError();
                    setPasswordConfirm(event.target.value);
                  }}
                  placeholder="새로운 비밀번호를 다시 입력해 주세요"
                  className={TICKETING_AUTH_INPUT_CLASS_NAME}
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

            <section className="rounded-2xl border border-[var(--border-strong)] bg-[linear-gradient(145deg,var(--surface-tint-strong)_0%,var(--surface-base)_100%)] px-4 py-4">
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
                    개인정보 이용 동의 (필수)
                  </Label>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                    축제 포털 및 티켓팅 서비스 이용을 위해 학번, 연락처, 재학정보, 소속 대학, 학과 정보의 수집 및 이용에 동의합니다.
                  </p>
                </div>
              </div>
            </section>

            <Button
              type="submit"
              className="h-11 w-full rounded-2xl bg-[var(--accent)] text-white shadow-[0_10px_18px_-12px_var(--shadow-color)] transition-all duration-200 hover:translate-y-[-1px] hover:brightness-95 disabled:translate-y-0 disabled:opacity-55"
              disabled={submitting}
            >
              <KeyRound className="h-4 w-4" strokeWidth={2.3} />
              {submitting ? loadingMessage || "처리 중..." : "재학생 인증 및 티켓팅 시작"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">이미 계정이 있으신가요?</p>
            <Link
              to="/ticket/login"
              state={{ authTabFrom: "signup" }}
              className="mt-2 inline-block text-sm font-semibold text-[var(--accent)]"
            >
              로그인하러 가기
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
