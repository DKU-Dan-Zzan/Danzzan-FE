// 역할: 내 정보 조회와 로그아웃 등 마이페이지 사용자 설정 동작을 제공하는 화면입니다.
import { useEffect, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  GraduationCap,
  IdCard,
  Lock,
  Ticket,
  User,
} from "lucide-react";
import { cn } from "@/components/common/ui/utils";
import { authLogout } from "@/api/app/auth/authApi";
import { studentProfileApi } from "@/api/app/auth/studentProfileApi";
import { useMyTicketsQuery } from "@/hooks/ticketing/useMyTicketsQuery";
import { authStore } from "@/store/common/authStore";

const FAQ_ITEMS = [
  {
    q: "티켓은 어떻게 수령하나요?",
    a: "공연 당일 행사장 입구에서 학생증을 제시하고 손목 밴드로 교환합니다.",
  },
  {
    q: "티켓을 분실했을 경우 어떻게 하나요?",
    a: "앱 내 내 티켓 화면에서 QR코드를 다시 확인할 수 있습니다. QR코드는 재발급되지 않으므로 스크린샷을 미리 저장해두세요.",
  },
  {
    q: "예매한 티켓을 취소할 수 있나요?",
    a: "현재 버전에서는 티켓 취소 기능이 제공되지 않습니다. 티켓 관련 문의는 학생처 또는 총학생회 공식 채널로 연락해주세요.",
  },
  {
    q: "공연 시간이 어떻게 되나요?",
    a: "타임테이블 탭에서 공연 일정과 아티스트 정보를 확인할 수 있습니다.",
  },
] as const;

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div>
      {FAQ_ITEMS.map((item, index) => (
        <div key={item.q} className="border-t border-[var(--mypage-faq-divider)] first:border-t-0">
          <button
            onClick={() => setOpen(open === index ? null : index)}
            className="flex w-full items-center justify-between gap-3 px-5 py-[15px] text-left"
          >
            <span className="text-[14px] leading-[1.4] text-[var(--mypage-faq-question)]">
              {item.q}
            </span>
            <ChevronDown
              size={16}
              aria-hidden
              className={cn(
                "shrink-0 transition-transform duration-200",
                open === index
                  ? "rotate-180 text-[var(--mypage-faq-icon-open)]"
                  : "text-[var(--mypage-faq-icon)]",
              )}
            />
          </button>
          {open === index && (
            <div className="bg-[var(--mypage-faq-answer-bg)] px-5 pb-4">
              <p className="text-[13px] leading-[1.65] text-[var(--mypage-faq-answer)]">
                {item.a}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-5 pb-3 pt-6 text-[16px] font-bold text-[var(--mypage-section-title)]">
      {children}
    </p>
  );
}

function ListSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y divide-[var(--mypage-list-divider)] bg-[var(--mypage-list-bg)]">
      {children}
    </div>
  );
}

function ListRow({
  icon,
  label,
  value,
  onClick,
  showArrow = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
  showArrow?: boolean;
}) {
  const content = (
    <div className="flex min-h-[54px] items-center gap-3.5 px-5 py-3">
      {icon && <span className="shrink-0 text-[var(--mypage-list-item-icon)]">{icon}</span>}
      <span className="flex-1 text-[15px] text-[var(--mypage-list-item-text)]">{label}</span>
      {value && <span className="text-[14px] text-[var(--mypage-list-item-value)]">{value}</span>}
      {showArrow && <ChevronRight size={16} className="shrink-0 text-[var(--mypage-list-arrow)]" />}
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left transition active:bg-gray-50">
        {content}
      </button>
    );
  }

  return <div>{content}</div>;
}

function MyPage() {
  const navigate = useNavigate();
  const session = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot,
  );

  const isLoggedIn = !!session.tokens?.accessToken && session.role === "student";
  const user = session.user;

  useEffect(() => {
    if (!isLoggedIn) return;

    const hasProfileGap = !user?.name?.trim() || !user?.college?.trim();
    const tokens = session.tokens;
    if (!hasProfileGap || !tokens) return;

    let cancelled = false;

    void (async () => {
      try {
        const freshUser = await studentProfileApi.me();
        if (!freshUser || cancelled) return;
        authStore.setSession({ tokens, user: freshUser }, session.role ?? undefined);
      } catch {
        // keep login payload profile on failure
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, session.role, session.tokens, user?.college, user?.name]);

  const ticketsQuery = useMyTicketsQuery(isLoggedIn);

  if (!isLoggedIn) {
    return (
      <div
        className="mypage-root flex min-h-full flex-col items-center justify-center px-6 py-[100px]"
        style={{ background: "var(--mypage-page-bg)" }}
      >
        <div
          className="w-full max-w-sm overflow-hidden rounded-[24px] px-6 py-9 text-center"
          style={{
            background: "var(--mypage-guest-card-bg)",
            boxShadow: "var(--mypage-guest-card-shadow)",
          }}
        >
          <div
            className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full"
            style={{
              background:
                "linear-gradient(135deg, var(--mypage-guest-icon-bg-start) 0%, var(--mypage-guest-icon-bg-end) 100%)",
              boxShadow: "var(--mypage-guest-icon-shadow)",
            }}
          >
            <User size={32} className="text-white" strokeWidth={1.8} />
          </div>

          <p className="mb-1 text-[10px] font-bold tracking-[0.24em] text-[var(--mypage-guest-overline)]">
            STUDENT PORTAL
          </p>
          <h2 className="mb-2 text-[20px] font-bold leading-[1.3] text-[var(--mypage-guest-title)]">
            내 정보를 보려면
            <br />
            로그인해 주세요
          </h2>
          <p className="mb-7 text-[13px] leading-relaxed text-[var(--mypage-guest-description)]">
            로그인 후 예매 내역과 계정 정보를 확인할 수 있어요.
          </p>

          <button
            onClick={() => navigate("/ticket/login")}
            className="h-[52px] w-full rounded-[14px] text-[15px] font-bold text-white transition active:brightness-95"
            style={{
              background: "var(--mypage-cta-gradient)",
              boxShadow: "var(--mypage-cta-shadow)",
            }}
          >
            로그인 / 회원가입하러 가기
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    void authLogout();
    authStore.clear();
    navigate("/ticket/login", { replace: true });
  };

  const tickets = ticketsQuery.data ?? [];
  const previewTickets = tickets.slice(0, 3);
  const usedCount = tickets.filter((ticket) => ticket.status === "used").length;

  return (
    <div className="mypage-root min-h-full" style={{ background: "var(--mypage-page-bg)" }}>
      <div className="bg-[var(--mypage-list-bg)] px-5 py-5">
        <div className="flex items-center gap-4">
          <div
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--mypage-profile-avatar-bg)" }}
          >
            <User size={22} strokeWidth={1.8} style={{ color: "var(--mypage-profile-avatar-icon)" }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-bold leading-tight text-[var(--mypage-profile-name)]">
              {user?.name ?? "—"}
            </p>
            <p className="mt-0.5 text-[13px] text-[var(--mypage-profile-subtitle)]">
              단국대학교 재학생
            </p>
          </div>
          <ChevronRight size={18} style={{ color: "var(--mypage-list-arrow)" }} />
        </div>
      </div>

      <div className="px-4 pt-4">
        <div
          className="overflow-hidden rounded-[20px]"
          style={{ background: "var(--mypage-ticket-hero-bg)" }}
        >
          <div className="flex items-center justify-between px-5 pb-4 pt-5">
            <div>
              <p className="mb-1 text-[12px] font-medium text-[var(--mypage-ticket-hero-muted)]">
                내 예매 티켓
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-[38px] font-bold leading-none text-[var(--mypage-ticket-hero-text)]">
                  {ticketsQuery.isPending ? "—" : tickets.length}
                </span>
                <span className="text-[16px] font-medium text-[var(--mypage-ticket-hero-muted)]">
                  장
                </span>
              </div>
              {!ticketsQuery.isPending && tickets.length > 0 && (
                <p className="mt-1 text-[12px] text-[var(--mypage-ticket-hero-muted)]">
                  사용됨 {usedCount}장
                </p>
              )}
            </div>

            <button
              onClick={() => navigate("/ticket/my-ticket")}
              className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold transition active:scale-95"
              style={{
                background: "var(--mypage-ticket-hero-btn-bg)",
                border: "1px solid var(--mypage-ticket-hero-btn-border)",
                color: "var(--mypage-ticket-hero-btn-text)",
              }}
            >
              <Ticket size={14} />
              내 티켓 보기
            </button>
          </div>

          {ticketsQuery.isPending ? (
            <div className="border-t px-5 py-4" style={{ borderColor: "var(--mypage-ticket-hero-row-divider)" }}>
              <p className="text-[13px] text-[var(--mypage-ticket-hero-muted)]">불러오는 중…</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="border-t px-5 py-4" style={{ borderColor: "var(--mypage-ticket-hero-row-divider)" }}>
              <p className="text-[13px] text-[var(--mypage-ticket-hero-muted)]">
                아직 예매된 티켓이 없어요
              </p>
            </div>
          ) : (
            <div
              className="divide-y border-t"
              style={{ borderColor: "var(--mypage-ticket-hero-row-divider)" }}
            >
              {previewTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => navigate("/ticket/my-ticket")}
                  className="flex w-full items-center justify-between px-5 py-3.5 text-left transition active:brightness-90"
                  style={{ borderColor: "var(--mypage-ticket-hero-row-divider)" }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-[var(--mypage-ticket-hero-text)]">
                      {ticket.eventName}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--mypage-ticket-hero-muted)]">
                      {ticket.eventDate} · {ticket.seat}
                    </p>
                  </div>
                  <span
                    className="ml-3 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      background: "rgba(255,255,255,0.18)",
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    {ticket.status === "issued"
                      ? "예매 완료"
                      : ticket.status === "used"
                        ? "사용됨"
                        : ticket.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <SectionTitle>학적 정보</SectionTitle>
      <ListSection>
        <ListRow icon={<IdCard size={18} />} label="학번" value={user?.studentId ?? "—"} />
        <ListRow icon={<GraduationCap size={18} />} label="단과대학" value={user?.college || "—"} />
        <ListRow icon={<GraduationCap size={18} />} label="학과" value={user?.department || "—"} />
      </ListSection>

      <SectionTitle>설정</SectionTitle>
      <ListSection>
        <ListRow
          icon={<Lock size={18} />}
          label="비밀번호 변경"
          onClick={() => navigate("/ticket/reset-password")}
          showArrow
        />
      </ListSection>

      <SectionTitle>자주 묻는 질문</SectionTitle>
      <div className="bg-[var(--mypage-list-bg)]">
        <FaqAccordion />
      </div>

      <div className="flex justify-center py-10">
        <button
          onClick={handleLogout}
          className="text-[14px] transition"
          style={{ color: "var(--mypage-logout-text)" }}
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}

export default MyPage;
