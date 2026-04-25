import { useState, useEffect, useCallback, useMemo, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CircleAlert,
  KeyRound,
  Phone,
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  CheckCircle2,
  Send,
  X,
  Eye,
  EyeOff,
  ArrowDown,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/common/ui/button";
import { Checkbox } from "@/components/common/ui/checkbox";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import {
  TicketingAuthHeading,
  TICKETING_AUTH_HEADER_SECTION_CLASS,
  TICKETING_AUTH_MAIN_CLASS,
} from "@/components/ticketing/auth/TicketingAuthHeading";
import { signupApi } from "@/api/ticketing/signupApi";
import { HttpError } from "@/api/ticketing/httpClient";
import { isAuthBoundaryError } from "@/api/common/authCore";
import {
  getPasswordPolicyState,
  getPasswordPolicyErrorMessage,
  PASSWORD_CONFIRM_MISMATCH_ERROR_MESSAGE,
  PASSWORD_POLICY_ERROR_MESSAGE,
} from "@/lib/ticketing/passwordPolicy";
import { TICKETING_AUTH_INPUT_CLASS_NAME } from "@/lib/ticketing/authInputClassNames";
import { APP_CARD_VARIANTS } from "@/components/common/ui/appCardVariants";
import { cn } from "@/components/common/ui/utils";

// ─── 동의 항목 데이터 ──────────────────────────────────────────────────────────

const CONSENT_ITEMS: { id: number; title: string; required: boolean; content: React.ReactNode }[] = [
  {
    id: 1,
    title: "개인정보의 제3자 제공에 대한 동의",
    required: true,
    content: (
      <div className="space-y-3 text-[13px] leading-6 text-[var(--text-muted)]">
        <p>
          총학생회는 개인정보를 개인정보 수집·이용 목적에서 명시한 범위 내에서 사용하며, 이용자의
          사전 동의 없이 목적 범위를 초과하여 이용하거나 원칙적으로 이용자의 개인정보를 제공하지
          않습니다. 다만, 아래와 같이 양질의 서비스 제공을 위해 이용자의 개인정보를 공유할 필요가
          있는 경우에는 필요한 범위 내에서 개인정보를 제3자에게 제공하고 있습니다.
        </p>
        <table className="w-full border-collapse border border-[var(--border-base)] text-[12px]">
          <thead>
            <tr className="bg-[var(--surface_container)]">
              {["제공받는 자", "제공 목적", "제공 항목", "보유 및 이용 기간"].map((h) => (
                <th key={h} className="border border-[var(--border-base)] px-2 py-1.5 text-left font-bold text-[var(--text)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-[var(--border-base)] px-2 py-1.5">네이버 주식회사</td>
              <td className="border border-[var(--border-base)] px-2 py-1.5">축제 행사장(단국존) 입장 관리 및 팔찌 배부 시 본인인증(Face ID) 서비스 연계</td>
              <td className="border border-[var(--border-base)] px-2 py-1.5">학번, 네이버 아이디</td>
              <td className="border border-[var(--border-base)] px-2 py-1.5">축제 종료 후 2026년 12월 31일까지</td>
            </tr>
          </tbody>
        </table>
        <p className="text-[11.5px]">
          ※ 네이버 주식회사가 제공하는 본인인증(Face ID) 서비스 이용 과정에서 얼굴 생체정보 등의
          추가 정보는 네이버 주식회사가 정보주체로부터 직접 수집·처리하며, 이에 관한 사항은
          네이버 주식회사의 개인정보처리방침 및 이용약관이 적용됩니다.
        </p>
        <p className="font-bold text-[var(--text)]">
          동의를 거부할 권리가 있으며, 거부 시 축제 행사장 입장 및 팔찌 배부가 불가하여 본 서비스
          중 축제 입출입 관련 기능 이용이 제한됩니다.
        </p>
      </div>
    ),
  },
  {
    id: 2,
    title: "개인정보 처리위탁에 대한 동의",
    required: true,
    content: (
      <div className="space-y-3 text-[13px] leading-6 text-[var(--text-muted)]">
        <p>
          총학생회는 원활하고 향상된 서비스를 제공하기 위해 개인정보 처리업무를 다른 회사에 위탁할
          수 있습니다. 총학생회는 아래와 같이 개인정보처리업무를 위탁하고 있고, 「개인정보 보호법」
          제26조 제6항에 따라 수탁자가 총학생회의 개인정보 처리 업무를 재위탁하는 경우 동의를 받고
          있습니다. 이용자는 동의를 거부할 수 있으나, 동의 거부 시 본 서비스 이용이 제한될 수
          있습니다.
        </p>
        <table className="w-full border-collapse border border-[var(--border-base)] text-[12px]">
          <thead>
            <tr className="bg-[var(--surface_container)]">
              {["수탁 업체", "위탁 업무"].map((h) => (
                <th key={h} className="border border-[var(--border-base)] px-2 py-1.5 text-left font-bold text-[var(--text)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-[var(--border-base)] px-2 py-1.5">엔에이치엔클라우드(주)</td>
              <td className="border border-[var(--border-base)] px-2 py-1.5">클라우드 인프라 제공</td>
            </tr>
            <tr>
              <td className="border border-[var(--border-base)] px-2 py-1.5">주식회사 파마링커</td>
              <td className="border border-[var(--border-base)] px-2 py-1.5">클라우드 제공</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 3,
    title: "필수 수집·이용 동의",
    required: true,
    content: (
      <div className="space-y-3 text-[13px] leading-6 text-[var(--text-muted)]">
        <div>
          <p className="font-bold text-[var(--text)]">가. 수집 및 이용 목적</p>
          <p className="mt-1">
            총학생회는 서비스사에서의 본인의 확인을 위해, 본 서비스를 제공하기 위해(축제정보 제공,
            축제 티켓팅 서비스 제공, 축제 행사장 입출입 확인 및 본인인증 연계, 축제 내 타임테이블
            제공), 본 서비스와 관련된 정보를 제공하기 위해, 앱 데이터 다운 개선 서비스 제공을 위해,
            문의에 대한 대응을 위해, 또한 최소한의 범위 내에서 개인정보를 수집합니다.
          </p>
        </div>
        <div>
          <p className="font-bold text-[var(--text)]">나. 수집 및 이용 항목</p>
          <ul className="mt-1 space-y-1">
            <li>• 이용자 본인 확인 및 서비스 제공에 관한 정보: 학번, 본 서비스 비밀번호(암호화 저장), 학적정보/소속(대학교/학교/전공/학년), 소속, 네이버 아이디</li>
            <li>• 회원가입 과정에서 일시적으로 수집 후 완료 시 즉시 삭제되는 정보: 단국대학교 포털 비밀번호</li>
          </ul>
          <p className="mt-1 text-[11.5px]">※ 서비스 이용 과정에서 자동으로 생성·수집되는 정보: 접속 로그, IP 주소, 쿠키, 브라우저 정보, OS 정보, 기기 정보(Device ID), 서비스 이용 기록(축제 정보 조회 이력, 공지 열람 이력, 티켓팅 이력 등)</p>
          <p className="text-[11.5px]">※ 이용자가 직접 작성한 정보: 문의, 의견, 텍스트 등</p>
        </div>
        <div>
          <p className="font-bold text-[var(--text)]">다. 보유 및 이용 기간</p>
          <p className="mt-1">
            서비스 탈퇴 시 또는 2026년 12월 31일 중 이른 시점까지 보유·이용하며, 이후 지체없이
            파기합니다. 다만, 관련 법령에 따라 일정 기간 보존해야 하는 경우에는 해당 법령에서 정한
            기간 동안 보관합니다.
          </p>
          <ul className="mt-1 space-y-0.5">
            <li>• 정보통신망법 본인확인에 관한 기록: 6개월</li>
            <li>• 통신비밀보호법 서비스 이용 관련 로그기록: 3개월</li>
          </ul>
        </div>
        <p className="font-bold text-[var(--text)]">
          동의를 거부할 권리가 있으며, 필수 항목에 대한 동의를 거부할 경우 회원가입 및 본 서비스
          이용이 불가능합니다.
        </p>
      </div>
    ),
  },
  {
    id: 4,
    title: "선택 수집·이용 동의 (광고 관련)",
    required: false,
    content: (
      <div className="space-y-3 text-[13px] leading-6 text-[var(--text-muted)]">
        <div>
          <p className="font-bold text-[var(--text)]">가. 수집 및 이용 목적</p>
          <p className="mt-1">
            본 서비스 내 광고 노출 최적화 및 광고 효과 분석을 위하여, 이용자의 이용 성향 및 관심사를
            분석하여 맞춤형 광고를 제공하기 위해 개인정보를 수집·이용합니다.
          </p>
        </div>
        <div>
          <p className="font-bold text-[var(--text)]">나. 수집 및 이용 항목</p>
          <ul className="mt-1 space-y-1">
            <li>• 광고식별자(ADID/IDFA)</li>
            <li>• 이용자의 광고 조회 이력 및 서비스 이용 기록(어떤 광고를 조회하였는지 등)</li>
          </ul>
        </div>
        <div>
          <p className="font-bold text-[var(--text)]">다. 보유 및 이용 기간</p>
          <p className="mt-1">수집일로부터 6개월</p>
        </div>
        <p>
          본 동의는 선택 사항이며, 동의를 거부하시더라도 본 서비스 이용에는 제한이 없습니다. 다만,
          맞춤형 광고가 제공되지 않을 수 있습니다.
        </p>
      </div>
    ),
  },
];

// ─── 상수 ────────────────────────────────────────────────────────────────────

const PAGE_TITLE = "축제 서비스 회원가입";
const EYEBROW = "2026 DANFESTA";
const ERROR_401 =
  "단국대 포털 학번 또는 비밀번호가 올바르지 않습니다.";
const ERROR_409 = "이미 가입한 학번입니다.";
const ERROR_403 = "죽전캠퍼스 재학생·수료생·대학원생만 회원가입이 가능합니다.";
const ERROR_SIGNUP = "회원가입에 실패했습니다.";
const AUTH_PLACEHOLDER_CLASS =
  "text-[0.96rem] sm:text-[0.98rem] placeholder:text-[0.8rem] sm:placeholder:text-[0.84rem] placeholder:tracking-[-0.01em]";

const STEP_LABELS = ["단국대 인증", "전화번호 인증", "가입 완료"] as const;
const NAVER_ID_CONFIRM_MISMATCH_ERROR_MESSAGE = "네이버 아이디가 서로 일치하지 않습니다.";
const NAVER_ID_LABEL_CLASS_NAME = "text-[var(--naver-green)]";
const NAVER_ID_INPUT_CLASS_NAME =
  "border-[var(--naver-green)] focus-visible:border-[var(--naver-green)] focus-visible:shadow-[0_0_0_4px_rgba(3,199,90,0.18)]";

// ─── 타입 ─────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function stripPhoneDashes(value: string): string {
  return value.replace(/\D/g, "");
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function copyTextWithFallback(value: string): Promise<boolean> {
  if (!value) {
    return false;
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // HTTP LAN access on mobile Safari/Chrome often blocks clipboard API.
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

function getPhoneVerificationErrorMessage(err: HttpError): string {
  const payload = err.payload as { error?: string; errorCode?: string } | undefined;
  const errorCode = payload?.errorCode ?? "";

  switch (errorCode) {
    case "PHONE_VERIFICATION_MESSAGE_NOT_FOUND":
      return "아직 문자가 수신되지 않았습니다. 문자 전송 후 잠시 뒤 다시 시도해주세요.";
    case "PHONE_VERIFICATION_SESSION_EXPIRED":
      return "인증 시간이 만료되었습니다. 인증코드를 다시 발급해주세요.";
    case "PHONE_VERIFICATION_ALREADY_VERIFIED":
      return "이미 인증이 완료된 세션입니다.";
    case "PHONE_VERIFICATION_TOO_MANY_ATTEMPTS":
      return "인증 시도 횟수를 초과했습니다. 인증코드를 다시 발급해주세요.";
    case "PHONE_VERIFICATION_PHONE_ALREADY_LINKED":
      return "이미 다른 계정에 연결된 전화번호입니다.";
    case "PHONE_VERIFICATION_CODE_MISMATCH":
      return "인증코드가 일치하지 않습니다. 문자를 다시 확인해주세요.";
    case "PHONE_VERIFICATION_SESSION_ALREADY_CONSUMED":
      return "이미 사용된 인증 세션입니다. 인증코드를 다시 발급해주세요.";
    case "PHONE_VERIFICATION_CREATE_RATE_LIMITED":
    case "PHONE_VERIFICATION_CREATE_COOLDOWN":
      return "잠시 후 다시 시도해주세요.";
    case "PHONE_VERIFICATION_OCTOMO_LOOKUP_FAILED":
      return "인증 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    default:
      return payload?.error ?? "인증 처리 중 오류가 발생했습니다.";
  }
}

// ─── 단계 표시기 ──────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-0 px-4 pb-4 pt-1">
      {STEP_LABELS.map((label, idx) => {
        const stepNum = (idx + 1) as Step;
        const isCompleted = current > stepNum;
        const isActive = current === stepNum;

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                  isCompleted
                    ? "bg-[var(--accent)] text-white"
                    : isActive
                      ? "bg-[var(--primary)] text-white shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_20%,transparent)]"
                      : "bg-[var(--surface_container)] text-[var(--text-muted)]",
                )}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : stepNum}
              </div>
              <span
                className={cn(
                  "whitespace-nowrap text-[10px] font-semibold tracking-tight",
                  isActive
                    ? "text-[var(--primary)]"
                    : isCompleted
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-muted)]",
                )}
              >
                {label}
              </span>
            </div>

            {idx < STEP_LABELS.length - 1 && (
              <div
                className={cn(
                  "mb-4 h-px w-10 transition-all duration-300",
                  current > stepNum
                    ? "bg-[var(--accent)]"
                    : "bg-[color:color-mix(in_srgb,var(--border-base)_60%,transparent)]",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── 오류 메시지 박스 ─────────────────────────────────────────────────────────

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-text)]">
      {message}
    </p>
  );
}

// ─── 동의 팝업 ────────────────────────────────────────────────────────────────

function ConsentModal({
  item,
  onClose,
  onAgree,
}: {
  item: (typeof CONSENT_ITEMS)[number];
  onClose: () => void;
  onAgree: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 backdrop-blur-sm"
      role="button"
      tabIndex={-1}
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        className="flex h-[70vh] w-full max-w-[var(--ticketing-mobile-shell-max-width)] flex-col rounded-t-[28px] bg-[var(--surface_container_lowest)] pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_40px_rgba(0,0,0,0.18)]"
        role="presentation"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex shrink-0 items-center justify-between border-b border-[color:color-mix(in_srgb,var(--border-base)_60%,transparent)] px-5 py-3">
          <p className="text-[15px] font-bold text-[var(--text)] leading-tight pr-4">
            {item.title}
            <span className="ml-2 text-xs font-semibold text-[var(--text-emphasis-vivid)]">
              ({item.required ? "필수" : "선택"})
            </span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface_container)] text-[var(--text-muted)]"
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {item.content}
        </div>
        {/* 하단 버튼 */}
        <div className="shrink-0 px-5 py-4">
          <button
            type="button"
            onClick={onAgree}
            className="h-11 w-full rounded-2xl bg-[linear-gradient(145deg,var(--ticketing-action-bg-start)_0%,var(--ticketing-action-bg-end)_100%)] text-[15px] font-semibold text-white"
          >
            동의
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function Signup() {
  const navigate = useNavigate();

  // ── 공통 상태
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  // ── Step 1 상태
  const [dkuStudentId, setDkuStudentId] = useState("");
  const [dkuPassword, setDkuPassword] = useState("");
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [signupToken, setSignupToken] = useState("");
  const [consents, setConsents] = useState([false, false, false, false]);
  const [activeConsentIdx, setActiveConsentIdx] = useState<number | null>(null);

  const toggleConsent = (idx: number) =>
    setConsents((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  const requiredConsentsMet = consents[0] && consents[1] && consents[2];
  const allConsented = consents.every(Boolean);
  const toggleAll = () => setConsents(allConsented ? [false, false, false, false] : [true, true, true, true]);

  // ── Step 2 상태
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [octomoReceiveNumber, setOctomoReceiveNumber] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sessionCreating, setSessionCreating] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [phoneVerificationSessionId, setPhoneVerificationSessionId] = useState("");

  // ── Step 3 상태
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [naverId, setNaverId] = useState("");
  const [naverIdConfirm, setNaverIdConfirm] = useState("");
  const [step3Error, setStep3Error] = useState<string | null>(null);

  // ── 비밀번호 표시 토글
  const [showPortalPw, setShowPortalPw] = useState(true);
  const [showPassword, setShowPassword] = useState(true);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(true);

  const passwordPolicy = getPasswordPolicyState(password, passwordConfirm);
  const isNaverIdMatched = naverId.trim().length > 0 && naverId.trim() === naverIdConfirm.trim();

  // ── 타이머
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // ── 인증 세션 생성
  const createPhoneSession = useCallback(async (token: string) => {
    setSessionCreating(true);
    setSessionError(null);
    setVerifyError(null);
    setPhoneNumber("");

    try {
      const res = await signupApi.createPhoneVerificationSession(token);
      setSessionId(res.sessionId);
      setMessageBody(res.messageBody);
      setOctomoReceiveNumber(res.octomoReceiveNumber);
      setExpiresAt(new Date(res.expiresAt));
      setSecondsLeft(res.expiresInSec);
    } catch (err) {
      if (err instanceof HttpError) {
        const payload = err.payload as { error?: string; errorCode?: string } | undefined;
        const errorCode = payload?.errorCode ?? "";
        if (
          errorCode === "PHONE_VERIFICATION_CREATE_RATE_LIMITED" ||
          errorCode === "PHONE_VERIFICATION_CREATE_COOLDOWN"
        ) {
          setSessionError("잠시 후 다시 시도해주세요.");
        } else {
          setSessionError(payload?.error ?? "인증 세션 생성에 실패했습니다.");
        }
      } else {
        setSessionError("인증 세션 생성에 실패했습니다.");
      }
    } finally {
      setSessionCreating(false);
    }
  }, []);

  // ── Step 2 진입 시 세션 자동 생성
  useEffect(() => {
    if (step === 2 && signupToken && !sessionId) {
      createPhoneSession(signupToken);
    }
  }, [step, signupToken, sessionId, createPhoneSession]);

  // ── Step 1 제출
  const handleStep1Submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStep1Error(null);

    if (!dkuStudentId.trim() || !dkuPassword.trim()) {
      setStep1Error("학번과 단국대 포털 비밀번호를 입력해 주세요.");
      return;
    }

    if (!requiredConsentsMet) {
      setStep1Error("필수 동의 항목을 모두 체크해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const { signupToken: token } = await signupApi.verifyStudent(dkuStudentId, dkuPassword);
      setSignupToken(token);
      setStep(2);
    } catch (err) {
      if (err instanceof HttpError) {
        const payload = err.payload as { error?: string } | undefined;
        const message = payload?.error;
        if (err.status === 401) {
          setStep1Error(message ?? "단국대 포털 학번 또는 비밀번호가 올바르지 않습니다.");
        } else if (err.status === 409) {
          setStep1Error(message ?? "이미 가입한 학번입니다.");
        } else {
          setStep1Error(message ?? "단국대 인증에 실패했습니다.");
        }
      } else if (isAuthBoundaryError(err) && err.status === 403) {
        const cause = err.cause as { response?: { data?: { error?: string } } } | undefined;
        setStep1Error(cause?.response?.data?.error ?? ERROR_403);
      } else {
        setStep1Error("단국대 인증에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 2 인증 확인
  const handleVerifyPhone = async () => {
    setVerifyError(null);

    const digits = stripPhoneDashes(phoneNumber);
    if (!digits || digits.length < 10) {
      setVerifyError("올바른 전화번호를 입력해 주세요.");
      return;
    }

    if (secondsLeft === 0) {
      setVerifyError("인증 시간이 만료되었습니다. 인증코드를 다시 발급해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await signupApi.verifyPhoneSession(sessionId, digits);
      if (res.status === "VERIFIED") {
        setPhoneVerificationSessionId(res.sessionId);
        setStep(3);
      }
    } catch (err) {
      if (err instanceof HttpError) {
        setVerifyError(getPhoneVerificationErrorMessage(err));
      } else {
        setVerifyError("인증 처리 중 오류가 발생했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 2 코드 복사
  const handleCopy = async () => {
    setCopyError(null);

    const copiedToClipboard = await copyTextWithFallback(messageBody);
    if (copiedToClipboard) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    setCopyError("자동 복사에 실패했습니다. 인증코드를 길게 눌러 직접 복사해주세요.");
  };

  // ── Step 3 제출
  const handleStep3Submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStep3Error(null);

    if (!password || !passwordConfirm) {
      setStep3Error("축제 서비스 전용 비밀번호를 입력해 주세요.");
      return;
    }

    const passwordPolicyError = getPasswordPolicyErrorMessage(passwordPolicy);
    if (passwordPolicyError) {
      setStep3Error(passwordPolicyError);
      return;
    }

    if (!naverId.trim() || !naverIdConfirm.trim()) {
      setStep3Error("네이버 아이디를 입력해 주세요.");
      return;
    }

    if (!isNaverIdMatched) {
      setStep3Error(NAVER_ID_CONFIRM_MISMATCH_ERROR_MESSAGE);
      return;
    }

    setSubmitting(true);
    try {
      await signupApi.completeSignup(
        signupToken,
        password,
        passwordConfirm,
        naverId.trim(),
        naverIdConfirm.trim(),
        phoneVerificationSessionId,
      );
      navigate("/ticket/login");
    } catch (err) {
      if (err instanceof HttpError) {
        const payload = err.payload as { error?: string } | undefined;
        const message = payload?.error;

        if (err.status === 401) {
          setStep3Error(message || ERROR_401);
        } else if (err.status === 409) {
          setStep3Error(message || ERROR_409);
        } else if (err.status === 403) {
          setStep3Error(message || ERROR_403);
        } else {
          setStep3Error(message || ERROR_SIGNUP);
        }
      } else if (isAuthBoundaryError(err) && err.status === 403) {
        setStep3Error(ERROR_403);
      } else {
        setStep3Error("회원가입에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── 모바일 감지 & SMS 딥링크
  // navigator.userAgent는 렌더 중 변하지 않으므로 useMemo로 한 번만 계산한다.
  const isMobile = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    [],
  );

  // iOS는 '&' 구분자, Android/기타는 RFC 5724 표준인 '?' 구분자를 사용한다.
  const smsHref = useMemo(() => {
    const isIOS =
      typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const sep = isIOS ? "&" : "?";
    return `sms:${octomoReceiveNumber}${sep}body=${encodeURIComponent(messageBody)}`;
  }, [octomoReceiveNumber, messageBody]);

  // ── 공통 래퍼
  const isSessionExpired = sessionId !== "" && secondsLeft === 0;
  const needsResend =
    isSessionExpired ||
    (verifyError?.includes("만료") ?? false) ||
    (verifyError?.includes("초과") ?? false) ||
    (verifyError?.includes("사용된") ?? false);

  return (
    <>
    {activeConsentIdx !== null && (
      <ConsentModal
        item={CONSENT_ITEMS[activeConsentIdx]}
        onClose={() => setActiveConsentIdx(null)}
        onAgree={() => {
          setConsents((prev) => prev.map((v, i) => (i === activeConsentIdx ? true : v)));
          setActiveConsentIdx(null);
        }}
      />
    )}
    <div className="relative left-1/2 min-h-screen w-screen -translate-x-1/2 overflow-hidden bg-[var(--bg-page-soft)]">
      {/* 배경 장식 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-[color:color-mix(in_srgb,var(--primary_container)_62%,white)] opacity-80 blur-3xl" />
        <div className="absolute right-[-5rem] top-1/4 h-72 w-72 rounded-full bg-[color:color-mix(in_srgb,var(--primary)_22%,white)] opacity-90 blur-3xl" />
        <div className="absolute bottom-[-4rem] left-1/4 h-64 w-64 rounded-full bg-[color:color-mix(in_srgb,var(--tertiary_container)_32%,white)] opacity-70 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[var(--ticketing-mobile-shell-max-width)] px-5 pb-8 pt-[calc(env(safe-area-inset-top)+5.25rem)] sm:px-6">
        <div className="w-full rounded-[30px] bg-[color:color-mix(in_srgb,var(--surface)_74%,transparent)] p-1 shadow-[0_20px_50px_rgba(44,52,54,0.06)] backdrop-blur-[24px]">
          <div className="rounded-[26px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface_container_low)_92%,white)_0%,color-mix(in_srgb,var(--surface_container_lowest)_96%,white)_100%)] px-4 py-6">
            <section className={TICKETING_AUTH_HEADER_SECTION_CLASS}>
              <TicketingAuthHeading eyebrow={EYEBROW} title={PAGE_TITLE} />
            </section>

            <StepIndicator current={step} />

            <main className={TICKETING_AUTH_MAIN_CLASS}>
              <div className="rounded-[24px] bg-[var(--surface_container_lowest)] px-3 py-4 shadow-[0_12px_30px_rgba(44,52,54,0.04)]">
                {/* ── Step 1: 단국대 인증 ── */}
                {step === 1 && (
                  <form className="space-y-5" onSubmit={handleStep1Submit}>
                    <section className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="dkuStudentId"
                          className="text-sm font-semibold text-[var(--text)]"
                        >
                          학번
                        </Label>
                        <Input
                          id="dkuStudentId"
                          value={dkuStudentId}
                          onChange={(e) => setDkuStudentId(e.target.value)}
                          placeholder="학번 8자리를 입력해 주세요"
                          className={cn(TICKETING_AUTH_INPUT_CLASS_NAME, AUTH_PLACEHOLDER_CLASS)}
                          required
                          disabled={submitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="dkuPassword"
                          className="text-sm font-semibold text-[var(--text)]"
                        >
                          포털 비밀번호
                        </Label>
                        <div className="relative">
                          <Input
                            id="dkuPassword"
                            type={showPortalPw ? "password" : "text"}
                            value={dkuPassword}
                            onChange={(e) => setDkuPassword(e.target.value)}
                            placeholder="단국대 포털 비밀번호를 입력해 주세요"
                            className={cn(TICKETING_AUTH_INPUT_CLASS_NAME, AUTH_PLACEHOLDER_CLASS, "pr-10")}
                            required
                            disabled={submitting}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPortalPw((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                            tabIndex={-1}
                          >
                            {showPortalPw ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
                          </button>
                        </div>
                      </div>

                      <p className="flex items-start gap-1.5 rounded-[20px] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface_container_low)_86%,white)_0%,color-mix(in_srgb,var(--primary_container)_18%,white)_100%)] px-3 py-2.5 text-[11px] font-medium leading-5 text-[var(--text-muted)]">
                        <CircleAlert
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-emphasis-vivid)]"
                          strokeWidth={2.3}
                        />
                        학생 인증을 위해 1회성으로만 사용하며 저장되지 않습니다.
                      </p>
                    </section>

                    {/* ── 개인정보 동의 항목 ── */}
                    <section className="space-y-0 rounded-xl border border-[color:color-mix(in_srgb,var(--border-base)_50%,transparent)] bg-[var(--surface_container)] px-2.5 py-1.5">
                      {/* 전체 동의 */}
                      <div className="flex items-center gap-2.5 rounded-lg px-1 py-0.5">
                        <Checkbox
                          id="consent-all"
                          checked={allConsented}
                          onCheckedChange={toggleAll}
                          disabled={submitting}
                          className="size-5 shrink-0 rounded-sm border-[var(--border-base)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:bg-[var(--accent)]"
                        />
                        <label
                          htmlFor="consent-all"
                          className="flex-1 cursor-pointer font-bold leading-tight text-[var(--text)]"
                          style={{ fontSize: "12px" }}
                        >
                          전체 동의
                        </label>
                      </div>
                      <div className="mx-1 h-px bg-[color:color-mix(in_srgb,var(--border-base)_60%,transparent)]" />
                      {CONSENT_ITEMS.map((item, idx) => (
                        <div
                          key={item.id}
                          className="relative flex items-center gap-1.5 rounded-lg pl-1 pr-0 py-0.5"
                        >
                          <Checkbox
                            id={`consent-${item.id}`}
                            checked={consents[idx]}
                            onCheckedChange={() => toggleConsent(idx)}
                            disabled={submitting}
                            className="size-5 shrink-0 rounded-sm border-[var(--border-base)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:bg-[var(--accent)]"
                          />
                          <label
                            htmlFor={`consent-${item.id}`}
                            className="min-w-0 flex-1 cursor-pointer pr-8 font-medium leading-snug text-[var(--text)]"
                            style={{ fontSize: "12px" }}
                          >
                            <span
                              className={cn(
                                "mr-1 font-semibold",
                                item.required
                                  ? "text-[var(--text-emphasis-vivid)]"
                                  : "text-[var(--text-muted)]",
                              )}
                            >
                              ({item.required ? "필수" : "선택"})
                            </span>
                            {item.title}
                          </label>
                          <button
                            type="button"
                            onClick={() => setActiveConsentIdx(idx)}
                            className="absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-end pr-0.5 font-normal text-[color:color-mix(in_srgb,var(--text-muted)_40%,transparent)] hover:text-[var(--text-muted)]"
                            style={{ fontSize: "11px" }}
                          >
                            &gt;
                          </button>
                        </div>
                      ))}
                    </section>

                    {step1Error && <ErrorBox message={step1Error} />}

                    <Button
                      type="submit"
                      className="h-11 w-full rounded-2xl border border-transparent bg-[linear-gradient(145deg,var(--ticketing-action-bg-start)_0%,var(--ticketing-action-bg-end)_100%)] text-[15px] font-semibold tracking-[-0.01em] text-white shadow-[var(--ticketing-action-shadow)] transition-all duration-200 hover:translate-y-[-1px] hover:brightness-95 disabled:translate-y-0 disabled:border-[var(--ticketing-action-disabled-border)] disabled:bg-[linear-gradient(145deg,var(--ticketing-action-disabled-bg-start)_0%,var(--ticketing-action-disabled-bg-end)_100%)] disabled:text-[var(--ticketing-action-disabled-text)] disabled:shadow-none disabled:opacity-100"
                      disabled={submitting}
                    >
                      <KeyRound className="h-4 w-4" strokeWidth={2.3} />
                      {submitting ? "단국대 포털 인증 중..." : "단국대 인증하기"}
                    </Button>
                  </form>
                )}

                {/* ── Step 2: 전화번호 인증 ── */}
                {step === 2 && (
                  <div className="space-y-5">
                    {/* 인증코드 발급 카드 */}
                    {sessionCreating && (
                      <div className="flex items-center justify-center gap-2 rounded-2xl border border-[color:color-mix(in_srgb,var(--border-base)_60%,transparent)] bg-[var(--surface-subtle)] px-4 py-6">
                        <RefreshCw className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-muted)]">인증코드 발급 중...</span>
                      </div>
                    )}

                    {sessionError && !sessionCreating && (
                      <div className="space-y-3">
                        <ErrorBox message={sessionError} />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-full rounded-2xl text-sm font-semibold"
                          onClick={() => createPhoneSession(signupToken)}
                          disabled={sessionCreating}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          다시 시도
                        </Button>
                      </div>
                    )}

                    {sessionId && !sessionCreating && (
                      <>
                        {/* 인증코드 안내 카드 */}
                        <div
                          className={cn(
                            "space-y-3 px-4 py-4",
                            APP_CARD_VARIANTS.gradTint,
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare
                              className="h-4 w-4 text-[var(--text-emphasis-vivid)]"
                              strokeWidth={2.2}
                            />
                            <p className="text-sm font-semibold text-[var(--text)]">
                              아래 인증코드를 복사해
                              <span className="ml-1 font-extrabold text-[var(--primary)]">
                                {octomoReceiveNumber.replace(/(\d{4})(\d{4})/, "$1-$2")}
                              </span>
                              으로 문자 전송해주세요
                            </p>
                          </div>

                          {/* 인증코드 + 복사 버튼 */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 rounded-xl bg-[color:color-mix(in_srgb,var(--surface_container_lowest)_80%,white)] px-4 py-3 text-center">
                              <span className="font-mono text-2xl font-extrabold tracking-[0.3em] text-[var(--primary)]">
                                {messageBody}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleCopy}
                              className={cn(
                                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                                copied
                                  ? "bg-[var(--status-success-bg)] text-[var(--status-success-text)]"
                                  : "bg-[color:color-mix(in_srgb,var(--primary)_12%,white)] text-[var(--primary)] hover:bg-[color:color-mix(in_srgb,var(--primary)_20%,white)]",
                              )}
                              aria-label="인증코드 복사"
                            >
                              {copied ? (
                                <Check className="h-4 w-4" strokeWidth={2.5} />
                              ) : (
                                <Copy className="h-4 w-4" strokeWidth={2.2} />
                              )}
                            </button>
                          </div>

                          {/* SMS 딥링크 버튼 — 모바일 환경에서만 노출 */}
                          {isMobile && (
                            <a
                              href={smsHref}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(145deg,var(--ticketing-action-bg-start)_0%,var(--ticketing-action-bg-end)_100%)] py-2.5 text-sm font-bold text-white shadow-[var(--ticketing-action-shadow)] transition-all duration-200 active:scale-[0.97] active:brightness-90"
                            >
                              <Send className="h-4 w-4" strokeWidth={2.2} />
                              문자 앱으로 바로 전송
                            </a>
                          )}

                          {/* 타이머 */}
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] text-[var(--text-muted)]">
                              {isMobile
                                ? "전송 후 인증 확인 버튼을 눌러주세요"
                                : "문자 전송 후 인증 확인 버튼을 눌러주세요"}
                            </p>
                            <span
                              className={cn(
                                "font-mono text-xs font-bold",
                                secondsLeft <= 60
                                  ? "text-[var(--status-danger-text)]"
                                  : "text-[var(--text-muted)]",
                              )}
                            >
                              {secondsLeft > 0 ? formatTimer(secondsLeft) : "만료됨"}
                            </span>
                          </div>

                          {copyError && (
                            <p className="text-[11px] font-medium text-[var(--status-danger-text)]">
                              {copyError}
                            </p>
                          )}
                        </div>

                        <div className="h-px bg-[linear-gradient(90deg,transparent_0%,color-mix(in_srgb,var(--primary)_18%,white)_18%,color-mix(in_srgb,var(--primary)_18%,white)_82%,transparent_100%)]" />

                        {/* 전화번호 입력 */}
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label
                              htmlFor="phoneNumber"
                              className="text-sm font-semibold text-[var(--text)]"
                            >
                              전화번호
                            </Label>
                            <div className="relative">
                              <Phone
                                className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
                                strokeWidth={2}
                              />
                              <Input
                                id="phoneNumber"
                                type="tel"
                                inputMode="numeric"
                                value={phoneNumber}
                                onChange={(e) =>
                                  setPhoneNumber(formatPhoneDisplay(e.target.value))
                                }
                                placeholder="010-0000-0000"
                                className={cn(
                                  TICKETING_AUTH_INPUT_CLASS_NAME,
                                  AUTH_PLACEHOLDER_CLASS,
                                  "pl-9",
                                )}
                                disabled={submitting || isSessionExpired}
                              />
                            </div>
                          </div>

                          {verifyError && <ErrorBox message={verifyError} />}

                          {/* 재발급 안내 */}
                          {needsResend && (
                            <button
                              type="button"
                              onClick={() => {
                                setSessionId("");
                                setVerifyError(null);
                                createPhoneSession(signupToken);
                              }}
                              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold text-[var(--text-emphasis-vivid)] hover:underline"
                              disabled={sessionCreating}
                            >
                              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.2} />
                              인증코드 재발급
                            </button>
                          )}

                          <Button
                            type="button"
                            className="h-11 w-full rounded-2xl border border-transparent bg-[linear-gradient(145deg,var(--ticketing-action-bg-start)_0%,var(--ticketing-action-bg-end)_100%)] text-[15px] font-semibold tracking-[-0.01em] text-white shadow-[var(--ticketing-action-shadow)] transition-all duration-200 hover:translate-y-[-1px] hover:brightness-95 disabled:translate-y-0 disabled:border-[var(--ticketing-action-disabled-border)] disabled:bg-[linear-gradient(145deg,var(--ticketing-action-disabled-bg-start)_0%,var(--ticketing-action-disabled-bg-end)_100%)] disabled:text-[var(--ticketing-action-disabled-text)] disabled:shadow-none disabled:opacity-100"
                            onClick={handleVerifyPhone}
                            disabled={submitting || isSessionExpired}
                          >
                            <CheckCircle2 className="h-4 w-4" strokeWidth={2.3} />
                            {submitting ? "인증 확인 중..." : "인증 확인"}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── Step 3: 가입 완료 ── */}
                {step === 3 && (
                  <form className="space-y-5" onSubmit={handleStep3Submit}>
                    <section className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="password"
                          className="text-sm font-semibold text-[var(--text)]"
                        >
                          축제 서비스 비밀번호
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "password" : "text"}
                            value={password}
                            onChange={(e) => {
                              if (step3Error === PASSWORD_POLICY_ERROR_MESSAGE) setStep3Error(null);
                              setPassword(e.target.value);
                            }}
                            placeholder="새로운 비밀번호를 입력해 주세요"
                            className={cn(TICKETING_AUTH_INPUT_CLASS_NAME, AUTH_PLACEHOLDER_CLASS, "pr-10")}
                            autoComplete="new-password"
                            required
                            disabled={submitting}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="passwordConfirm"
                          className="text-sm font-semibold text-[var(--text)]"
                        >
                          축제 서비스 비밀번호 확인
                        </Label>
                        <div className="relative">
                          <Input
                            id="passwordConfirm"
                            type={showPasswordConfirm ? "password" : "text"}
                            value={passwordConfirm}
                            onChange={(e) => {
                              if (
                                step3Error === PASSWORD_CONFIRM_MISMATCH_ERROR_MESSAGE ||
                                step3Error === PASSWORD_POLICY_ERROR_MESSAGE
                              ) {
                                setStep3Error(null);
                              }
                              setPasswordConfirm(e.target.value);
                            }}
                            placeholder="새로운 비밀번호를 다시 입력해 주세요"
                            className={cn(TICKETING_AUTH_INPUT_CLASS_NAME, AUTH_PLACEHOLDER_CLASS, "pr-10")}
                            autoComplete="new-password"
                            required
                            disabled={submitting}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswordConfirm((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                            tabIndex={-1}
                          >
                            {showPasswordConfirm ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 pl-1">
                        <p className="text-[11px] leading-5 text-[var(--text-muted)]">
                          • 8자 이상으로 입력해 주세요.
                        </p>
                        <p className="text-[11px] leading-5 text-[var(--text-muted)]">
                          • 특수문자를 최소 1개 포함해 주세요.
                        </p>
                      </div>

                      {/* ── 네이버 아이디 섹션 ── */}
                      <div className="space-y-3 rounded-xl border border-[rgba(3,199,90,0.22)] bg-[rgba(3,199,90,0.03)] p-3.5">
                        {/* 헤더 */}
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[var(--naver-green)] text-[13px] font-black text-white">
                            N
                          </div>
                          <span className="text-[13px] font-bold text-[var(--text)]">입장 확인용 네이버 아이디 등록</span>
                        </div>

                        {/* 안내 박스 */}
                        <div className="flex items-start gap-2 rounded-lg bg-[rgba(3,199,90,0.08)] px-3 py-2.5">
                          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--naver-green)]" strokeWidth={2.2} />
                          <p className="text-[11.5px] leading-[1.6] text-[var(--text-muted)]">
                            얼굴인식 입장(FaceSign)에 사용할 네이버 아이디를 정확히 확인해 주세요.<br />
                            오입력을 방지하기 위해 동일한 아이디를 한 번 더 입력합니다.
                          </p>
                        </div>

                        {/* 네이버 아이디 */}
                        <div className="space-y-2">
                          <Label htmlFor="naverId" className={cn("text-sm font-semibold", NAVER_ID_LABEL_CLASS_NAME)}>
                            네이버 아이디
                          </Label>
                          <div className="relative">
                            <Input
                              id="naverId"
                              value={naverId}
                              onChange={(e) => {
                                if (step3Error === NAVER_ID_CONFIRM_MISMATCH_ERROR_MESSAGE) setStep3Error(null);
                                setNaverId(e.target.value);
                              }}
                              placeholder="네이버 아이디를 입력해 주세요"
                              className={cn(TICKETING_AUTH_INPUT_CLASS_NAME, AUTH_PLACEHOLDER_CLASS, NAVER_ID_INPUT_CLASS_NAME, "pr-10")}
                              autoComplete="username"
                              required
                              disabled={submitting}
                            />
                            {naverId.trim().length > 0 && (
                              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--naver-green)]" strokeWidth={2} />
                            )}
                          </div>
                        </div>

                        {/* 화살표 */}
                        <div className="flex justify-center">
                          <ArrowDown className="h-4 w-4 text-[var(--naver-green)]" strokeWidth={2.2} />
                        </div>

                        {/* 네이버 아이디 재입력 */}
                        <div className="space-y-2">
                          <Label htmlFor="naverIdConfirm" className={cn("text-sm font-semibold", NAVER_ID_LABEL_CLASS_NAME)}>
                            네이버 아이디 재입력
                          </Label>
                          <div className="relative">
                            <Input
                              id="naverIdConfirm"
                              value={naverIdConfirm}
                              onChange={(e) => {
                                if (step3Error === NAVER_ID_CONFIRM_MISMATCH_ERROR_MESSAGE) setStep3Error(null);
                                setNaverIdConfirm(e.target.value);
                              }}
                              placeholder="네이버 아이디를 다시 입력해 주세요"
                              className={cn(TICKETING_AUTH_INPUT_CLASS_NAME, AUTH_PLACEHOLDER_CLASS, NAVER_ID_INPUT_CLASS_NAME, "pr-10")}
                              autoComplete="off"
                              required
                              disabled={submitting}
                            />
                            {naverIdConfirm.trim().length > 0 && (
                              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--naver-green)]" strokeWidth={2} />
                            )}
                          </div>

                          {/* 일치 확인 */}
                          {isNaverIdMatched && (
                            <div className="flex items-center gap-1.5 pl-0.5">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--naver-green)]" strokeWidth={2.2} />
                              <span className="text-[11.5px] font-medium text-[var(--naver-green)]">입력한 네이버 아이디가 일치합니다.</span>
                            </div>
                          )}
                        </div>

                        {/* 하단 안내 */}
                        <div className="flex items-start gap-2 rounded-lg bg-[var(--status-danger-bg)] px-3 py-2.5">
                          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--status-danger-text)]" strokeWidth={2} />
                          <p className="text-[11.5px] leading-[1.6] text-[var(--status-danger-text)]">
                            빠른 단국존 입장을 위해서는 네이버 Face Sign 사전 인증이 필요합니다.
                          </p>
                        </div>
                      </div>
                    </section>

                    {step3Error && <ErrorBox message={step3Error} />}

                    <Button
                      type="submit"
                      className="h-11 w-full rounded-2xl border border-transparent bg-[var(--naver-green)] text-[15px] font-semibold tracking-[-0.01em] text-white shadow-[0_4px_16px_rgba(3,199,90,0.35)] transition-all duration-200 hover:translate-y-[-1px] hover:brightness-95 disabled:translate-y-0 disabled:border-[var(--ticketing-action-disabled-border)] disabled:bg-[linear-gradient(145deg,var(--ticketing-action-disabled-bg-start)_0%,var(--ticketing-action-disabled-bg-end)_100%)] disabled:text-[var(--ticketing-action-disabled-text)] disabled:shadow-none disabled:opacity-100"
                      disabled={submitting}
                    >
                      <KeyRound className="h-4 w-4" strokeWidth={2.3} />
                      {submitting ? "처리 중..." : "가입 완료"}
                    </Button>
                  </form>
                )}
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-[var(--text-muted)]">이미 계정이 있으신가요?</p>
                <Link
                  to="/ticket/login"
                  state={{ authTabFrom: "signup" }}
                  className="mt-2 inline-block text-sm font-semibold text-[var(--text-emphasis-vivid)]"
                >
                  로그인하러 가기
                </Link>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
