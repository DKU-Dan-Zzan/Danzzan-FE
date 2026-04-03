// 역할: 내 정보 조회와 로그아웃 등 마이페이지 사용자 설정 동작을 제공하는 화면입니다.
import { useEffect, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  GraduationCap,
  IdCard,
  Lock,
  LogOut,
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
            className="flex w-full items-center justify-between gap-3 px-5 py-[10px] text-left"
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

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-4 mt-3 overflow-hidden rounded-[16px] bg-white" style={{ boxShadow: "0 1px 8px rgba(28,43,106,0.08)" }}>
      <p className="px-5 pb-1 pt-4 text-[16px] font-bold" style={{ color: "#1c2b6a" }}>
        {title}
      </p>
      <div className="divide-y divide-[var(--mypage-list-divider)]">{children}</div>
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
    <div className="flex min-h-[44px] items-center gap-3.5 px-5 py-2">
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
      <div className="mypage-root relative flex min-h-full flex-col items-center justify-center px-6 py-[100px]">
        {/* 포스터 배경 */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/posters/festival-poster.png"
            alt=""
            aria-hidden
            className="h-full w-full object-cover object-top"
            style={{ filter: "brightness(0.9) saturate(1.1)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(238,241,248,0.6) 0%, rgba(238,241,248,0.88) 100%)",
            }}
          />
        </div>

        {/* 글래스모피즘 카드 */}
        <div
          className="relative w-full max-w-sm overflow-hidden rounded-[24px] px-6 py-9 text-center"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.9)",
            boxShadow: "0 8px 40px rgba(28,43,106,0.1)",
          }}
        >
          <div
            className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full"
            style={{
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(8px)",
              border: "1.5px solid rgba(28,43,106,0.15)",
              boxShadow: "0 2px 12px rgba(28,43,106,0.12)",
            }}
          >
            <User size={32} strokeWidth={1.8} style={{ color: "#1c2b6a" }} />
          </div>

          <p className="mb-1 text-[10px] font-bold tracking-[0.24em]" style={{ color: "rgba(28,43,106,0.5)" }}>
            STUDENT PORTAL
          </p>
          <h2 className="mb-2 text-[20px] font-bold leading-[1.3]" style={{ color: "#1c2b6a" }}>
            내 정보를 보려면
            <br />
            로그인해 주세요
          </h2>
          <p className="mb-7 text-[13px] leading-relaxed" style={{ color: "rgba(28,43,106,0.55)" }}>
            로그인 후 예매 내역과 계정 정보를 확인할 수 있어요.
          </p>

          <button
            onClick={() => navigate("/ticket/login")}
            className="h-[52px] w-full rounded-[14px] text-[15px] font-bold transition active:brightness-95"
            style={{
              background: "rgba(28,43,106,0.12)",
              backdropFilter: "blur(8px)",
              border: "1.5px solid rgba(28,43,106,0.35)",
              color: "#1c2b6a",
              boxShadow: "0 2px 12px rgba(28,43,106,0.08)",
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
  const usedCount = tickets.filter((ticket) => ticket.status === "used").length;

  return (
    <div className="mypage-root min-h-full" style={{ background: "#eef1f8" }}>
      {/* 포스터 배경 — 배너+버튼 전체 영역 커버 */}
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/posters/festival-poster.png"
            alt=""
            aria-hidden
            className="h-full w-full object-cover object-top"
            style={{ filter: "brightness(0.78) saturate(1.1)", transform: "scale(1.04)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(28,43,106,0.3) 0%, rgba(28,43,106,0.55) 50%, #eef1f8 100%)",
            }}
          />
        </div>

        {/* 배너 콘텐츠 */}
        <div className="relative" style={{ height: 220 }}>
          {/* 우상단 축제 타이틀 */}
          <div className="absolute right-4 top-4 text-right">
            <p className="text-[10px] font-medium tracking-widest text-white/60">2026 DANFESTA</p>
            <p className="text-[13px] font-semibold text-white/80">落花流水 ;만개</p>
          </div>
          {/* 좌하단 프로필 */}
          <div className="absolute bottom-5 left-5 flex items-end gap-3">
            <div
              className="h-[80px] w-[80px] shrink-0 overflow-hidden rounded-full border-2 border-white/30"
              style={{ background: "rgba(220,229,240,0.25)", backdropFilter: "blur(8px)" }}
            >
              <img src="/latte.png" alt="마스코트" className="h-full w-full object-cover object-top" />
            </div>
            <div className="pb-0.5">
              <p className="text-[26px] font-bold leading-tight text-white drop-shadow">
                {user?.name ?? "—"}
              </p>
              <p className="mt-0.5 text-[13px] text-white/70">단국대학교 재학생</p>
            </div>
          </div>
        </div>

        {/* 티켓 버튼 */}
        <div className="relative px-4 pb-3 pt-1">
        <button
          onClick={() => navigate("/ticket/my-ticket")}
          className="flex w-full items-center justify-between overflow-hidden rounded-[16px] px-5 py-4 transition active:brightness-90"
          style={{
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(58,95,168,0.15)",
            boxShadow: "0 2px 12px rgba(28,43,106,0.1)",
          }}
        >
          <div className="flex items-center gap-3">
            <span style={{ color: "#3a5fa8" }}>
              <Ticket size={20} />
            </span>
            <span className="text-[15px] font-semibold" style={{ color: "#1c2b6a" }}>내 예매 티켓</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold" style={{ color: "#1c2b6a" }}>
              {ticketsQuery.isPending ? "—" : `${tickets.length}장`}
            </span>
            {!ticketsQuery.isPending && tickets.length > 0 && (
              <span className="text-[12px]" style={{ color: "#3a5fa8", opacity: 0.7 }}>(사용 {usedCount}장)</span>
            )}
            <ChevronRight size={16} style={{ color: "#3a5fa8", opacity: 0.6 }} />
          </div>
        </button>
      </div>
      </div>

      <div className="mt-2" />
      <SectionCard title="학적 정보">
        <ListRow icon={<IdCard size={18} />} label="학번" value={user?.studentId ?? "—"} />
        <ListRow icon={<GraduationCap size={18} />} label="단과대학" value={user?.college || "—"} />
        <ListRow icon={<GraduationCap size={18} />} label="학과" value={user?.department || "—"} />
      </SectionCard>

      <div className="mx-4 mt-3 overflow-hidden rounded-[16px] bg-white" style={{ boxShadow: "0 1px 8px rgba(28,43,106,0.08)" }}>
        <p className="px-5 pb-1 pt-4 text-[16px] font-bold" style={{ color: "#1c2b6a" }}>자주 묻는 질문</p>
        <FaqAccordion />
      </div>

      <SectionCard title="설정">
        <ListRow
          icon={<Lock size={18} />}
          label="비밀번호 변경"
          onClick={() => navigate("/ticket/reset-password")}
          showArrow
        />
        <ListRow
          icon={<LogOut size={18} />}
          label="로그아웃"
          onClick={handleLogout}
          showArrow
        />
      </SectionCard>
      <div className="h-4" />
    </div>
  );
}

export default MyPage;
