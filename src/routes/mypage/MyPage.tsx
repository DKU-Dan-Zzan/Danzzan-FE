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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/common/ui/alert-dialog";

const FAQ_ITEMS = [
  {
    q: "단국존 오프라인 예매는 없나요?",
    a: "<2026 DANFESTA 落花流水 ;만개>의 단국존 예매는 전면 온라인으로 진행됩니다.\n오프라인 티켓 예매 진행 시, 야간 대기 도중 발생할 수 있는 안전상의 사고를 미연에 방지하기 위하여 티켓의 수량 모두 온라인으로 진행하게 된 점 양해 부탁드립니다.",
  },
  {
    q: "단국존 입장 기준은 무엇인가요?",
    a: "단국대학교 죽전캠퍼스 축제는 재학생들의 등록금과 학생회비를 통해 준비된 행사입니다. 따라서 해당 재학생들의 무대 관람을 위하여 단국존을 설치하게 되었습니다.\n\n단국존 입장은 단페스타 전용 웹앱에서 티켓팅 성공자에 한하여 팔찌 수령 후 입장 가능한 점 참고 부탁드립니다.\n\n공연이 진행되는 노천마당의 특성상 관람석이 계단식으로 되어 있어, 단국존이 아니더라도 원활한 무대 관람이 가능한 점 알려드립니다.",
  },
  {
    q: "팔찌 없이 무대관람이 가능한가요?",
    a: "공연이 진행되는 노천마당의 특성상 관람석이 계단식으로 되어 있어, 단국존이 아니더라도 원활한 무대 관람이 가능합니다. 무대 관람을 위한 티켓은 별도로 필요하지 않습니다.",
  },
  {
    q: "단국존 팔찌를 양도해도 되나요?",
    a: "총학생회는 단국존 팔찌 매매 및 양도를 금지하며, 발견 즉시 회수 및 폐기 처분 예정입니다.\n신청한 정보와 수령인이 제시하는 웹정보는 본인이 동일인이어야 하며, 캡처본 제시는 불가능합니다.",
  },
  {
    q: "축제 중 흡연부스는 어디인가요?",
    a: "노천마당, 혜당관, 곰상, 폭포공원 등 축제 콘텐츠가 진행되는 곳 모두 금연 구역입니다. 기존 흡연구역과 축제 당일 추가로 설치 예정인 임시 흡연구역을 이용해 주시기 바랍니다.",
  },
  {
    q: "축제에서 음주가 가능한가요?",
    a: "가능합니다.\n주류 판매 라이선스를 소유한 업체가 입점하여 주류를 판매할 예정입니다. 원활한 구매를 위해 법정 신분증을 지참해 주시기 바랍니다.\n※ 학생운영 주점에서의 주류 판매 및 배부는 관련 법령에 근거하여 금지됩니다. 병으로 된 주류는 사고 예방을 위해 제지할 수 있습니다.",
  },
  {
    q: "축제 당일에는 휴강 안 하나요?",
    a: "축제 당일 학교 본부 주관 휴강은 예정되어 있지 않습니다. 당일 강의 일정은 교수님의 재량에 따라 변동될 수 있습니다.",
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
            <div className="bg-[var(--mypage-faq-answer-bg)] px-5 pb-4 pt-3">
              <p className="whitespace-pre-line text-[13px] leading-[1.65] text-[var(--mypage-faq-answer)]">
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
      <p className="px-5 pb-1 pt-4 text-[16px] font-bold" style={{ color: "var(--poster-navy)" }}>
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
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

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
      <div className="mypage-root relative flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden px-6 pb-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom)+1.5rem)] pt-[calc(env(safe-area-inset-top)+4.5rem)]">
        {/* 포스터 배경 */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/posters/main-poster-final-vertical.jpeg"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-top"
            style={{ filter: "brightness(0.82) saturate(1.08)", transform: "scale(1.03)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(238,241,248,0.4) 0%, rgba(238,241,248,0.68) 38%, rgba(238,241,248,0.86) 100%)",
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
            <User size={32} strokeWidth={1.8} style={{ color: "var(--poster-navy)" }} />
          </div>

          <p className="mb-1 text-[10px] font-bold tracking-[0.24em]" style={{ color: "rgba(28,43,106,0.5)" }}>
            STUDENT PORTAL
          </p>
          <h2 className="mb-2 text-[20px] font-bold leading-[1.3]" style={{ color: "var(--poster-navy)" }}>
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
              color: "var(--poster-navy)",
              boxShadow: "0 2px 12px rgba(28,43,106,0.08)",
            }}
          >
            로그인 / 회원가입하러 가기
          </button>
        </div>
      </div>
    );
  }

  const handleLogoutConfirm = () => {
    setLogoutConfirmOpen(false);
    void authLogout();
    authStore.clear();
    navigate("/ticket/login", { replace: true });
  };

  const tickets = ticketsQuery.data ?? [];
  const usedCount = tickets.filter((ticket) => ticket.status === "used").length;

  return (
    <div className="mypage-root min-h-full" style={{ background: "var(--poster-bg)" }}>
      <div className="h-[calc(env(safe-area-inset-top)+68px)]" />
      {/* 포스터 배경 — 배너+버튼 전체 영역 커버 */}
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/posters/main-poster-final-vertical.jpeg"
            alt=""
            aria-hidden
            className="h-full w-full object-cover object-top"
            style={{ filter: "brightness(0.78) saturate(1.1)", transform: "scale(1.04)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(28,43,106,0.3) 0%, rgba(28,43,106,0.55) 50%, var(--poster-bg) 100%)",
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
              <img src={`/profiles/latte-${(parseInt(user?.id ?? "0", 10) % 8) + 1}.jpeg`} alt="프로필" className="h-full w-full object-cover object-top" />
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
            <span style={{ color: "var(--poster-blue)" }}>
              <Ticket size={20} />
            </span>
            <span className="text-[15px] font-semibold" style={{ color: "var(--poster-navy)" }}>내 예매 티켓</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold" style={{ color: "var(--poster-navy)" }}>
              {ticketsQuery.isPending ? "—" : `${tickets.length}장`}
            </span>
            {!ticketsQuery.isPending && tickets.length > 0 && (
              <span className="text-[12px]" style={{ color: "var(--poster-blue)", opacity: 0.7 }}>(사용 {usedCount}장)</span>
            )}
            <ChevronRight size={16} style={{ color: "var(--poster-blue)", opacity: 0.6 }} />
          </div>
        </button>
      </div>
      </div>

      <div className="mt-2" />
      <SectionCard title="내 정보">
        <ListRow icon={<IdCard size={18} />} label="학번" value={user?.studentId ?? "—"} />
        <ListRow icon={<GraduationCap size={18} />} label="단과대학" value={user?.college || "—"} />
        <ListRow icon={<GraduationCap size={18} />} label="학과" value={user?.department || "—"} />
        <ListRow icon={<IdCard size={18} />} label="네이버 아이디" value={user?.naverId ? user.naverId.split("@")[0] : undefined} />
      </SectionCard>

      <div className="mx-4 mt-3 overflow-hidden rounded-[16px] bg-white" style={{ boxShadow: "0 1px 8px rgba(28,43,106,0.08)" }}>
        <p className="px-5 pb-1 pt-4 text-[16px] font-bold" style={{ color: "var(--poster-navy)" }}>자주 묻는 질문</p>
        <FaqAccordion />
      </div>

      <SectionCard title="계정 관리">
        <ListRow
          icon={<Lock size={18} />}
          label="비밀번호 변경"
          onClick={() => navigate("/ticket/reset-password")}
          showArrow
        />
        <ListRow
          icon={<LogOut size={18} />}
          label="로그아웃"
          onClick={() => setLogoutConfirmOpen(true)}
          showArrow
        />
      </SectionCard>
      <div className="h-4" />

      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그아웃 확인</AlertDialogTitle>
            <AlertDialogDescription>정말 로그아웃하시겠어요?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="text-[var(--text-on-accent)] hover:brightness-95"
              style={{
                backgroundColor: "var(--primary)",
                backgroundImage: "none",
                boxShadow: "none",
              }}
              onClick={handleLogoutConfirm}
            >
              로그아웃
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default MyPage;
