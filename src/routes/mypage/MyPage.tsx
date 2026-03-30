// 역할: 내 정보 조회와 로그아웃 등 마이페이지 사용자 설정 동작을 제공하는 화면입니다.
import { useNavigate } from "react-router-dom";
import { useEffect, useSyncExternalStore } from "react";
import { authLogout } from "@/api/app/auth/authApi";
import { studentProfileApi } from "@/api/app/auth/studentProfileApi";
import { authStore } from "@/store/common/authStore";
import { GraduationCap, IdCard, User } from "lucide-react";
import { APP_CARD_VARIANTS } from "@/components/common/ui/appCardVariants";

const MYPAGE_GUEST_ROOT_CLASS =
  "mypage-root relative flex min-h-full flex-col items-center justify-center overflow-hidden bg-[var(--bg-page-soft)] px-6 py-[100px]";
const MYPAGE_GUEST_CARD_CLASS =
  "relative flex w-full max-w-sm flex-col items-center gap-5 rounded-[28px] border border-[var(--mypage-guest-card-border)] bg-[var(--mypage-guest-card-bg)] px-6 py-8 text-center shadow-[var(--mypage-guest-card-shadow)] backdrop-blur-[6px]";
const MYPAGE_PORTAL_CARD_CLASS =
  `relative overflow-hidden ${APP_CARD_VARIANTS.gradTint} rounded-[30px]`;

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
    if (!isLoggedIn) {
      return;
    }

    const hasProfileGap = !user?.name?.trim() || !user?.college?.trim();
    const tokens = session.tokens;
    if (!hasProfileGap || !tokens) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const freshUser = await studentProfileApi.me();
        if (!freshUser || cancelled) {
          return;
        }
        authStore.setSession(
          {
            tokens,
            user: freshUser,
          },
          session.role ?? undefined,
        );
      } catch {
        // Fallback: keep login payload profile when /user/me request fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, session.role, session.tokens, user?.college, user?.name]);

  if (!isLoggedIn) {
    return (
      <div className={MYPAGE_GUEST_ROOT_CLASS}>
        <div className={MYPAGE_GUEST_CARD_CLASS}>
          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-[var(--mypage-guest-icon-border)] bg-[linear-gradient(145deg,var(--mypage-guest-icon-bg-start)_0%,var(--mypage-guest-icon-bg-end)_100%)] shadow-[var(--mypage-guest-icon-shadow)]">
            <User size={38} className="text-[var(--text-on-accent)]" />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--mypage-guest-overline)]">STUDENT PROFILE</p>
            <h2 className="text-xl font-extrabold tracking-tight text-[var(--mypage-guest-title)]">내정보를 보려면 로그인해 주세요</h2>
            <p className="text-sm leading-relaxed text-[var(--mypage-guest-description)]">로그인 후 예매 내역과 계정 정보를 확인할 수 있어요.</p>
          </div>

          <button
            onClick={() => navigate("/ticket/login")}
            className="h-[52px] w-full rounded-2xl bg-[linear-gradient(145deg,var(--mypage-guest-cta-bg-start)_0%,var(--mypage-guest-cta-bg-end)_100%)] text-sm font-bold text-[var(--text-on-accent)] shadow-[var(--mypage-guest-cta-shadow)] transition hover:brightness-95"
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

  const infoItems = [
    {
      label: "학번",
      value: user?.studentId ?? "-",
      icon: IdCard,
    },
    {
      label: "단과대학",
      value: user?.college || "-",
      icon: GraduationCap,
    },
    {
      label: "학과",
      value: user?.department || "-",
      icon: GraduationCap,
    },
  ];

  return (
    <div className="mypage-root relative min-h-full overflow-hidden bg-[var(--bg-page-soft)]">
      <div className="relative px-4 pt-[var(--app-header-first-card-gap)]">
        <div className={MYPAGE_PORTAL_CARD_CLASS}>
          <div className="relative flex items-start justify-between gap-4 px-5 py-6">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--text-emphasis-vivid)]">DANFESTA PORTAL</p>
              <h1 className="mt-1 text-[length:var(--mypage-portal-name-size)] leading-[1.1] font-extrabold tracking-[-0.02em] text-[var(--mypage-portal-name)]">{user?.name ?? "-"}</h1>
              <p className="mt-2 text-base leading-[1.3] text-[var(--mypage-portal-subtitle)]">단국대학교 재학생</p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-[var(--mypage-portal-icon-border)] bg-[linear-gradient(145deg,var(--mypage-portal-icon-bg-start)_0%,var(--mypage-portal-icon-bg-end)_100%)] shadow-[var(--mypage-portal-icon-shadow)] backdrop-blur-[6px]">
              <User size={28} className="text-[var(--mypage-portal-icon-color)]" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-[430px] px-4 pt-5">
        <div className="overflow-hidden rounded-[28px] border border-[var(--mypage-info-card-border)] bg-[var(--mypage-info-card-bg)] shadow-[var(--mypage-info-card-shadow)]">
          <div className="border-b border-[var(--mypage-info-header-border)] bg-[linear-gradient(180deg,var(--mypage-info-header-bg-start)_0%,var(--mypage-info-header-bg-end)_100%)] px-5 py-4">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--text-emphasis-vivid)]">MY INFO</p>
            <h2 className="mt-1 text-[18px] font-bold tracking-tight text-[var(--mypage-info-title)]">학적 정보</h2>
          </div>

          <div className="divide-y divide-[var(--mypage-info-item-divider)]">
            {infoItems.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-[var(--mypage-info-icon-size)] w-[var(--mypage-info-icon-size)] items-center justify-center rounded-full border border-[var(--mypage-info-icon-border)] bg-[linear-gradient(145deg,var(--mypage-info-icon-bg-start)_0%,var(--mypage-info-icon-bg-end)_100%)] shadow-[var(--mypage-info-icon-shadow)] backdrop-blur-[6px]">
                  <Icon size={18} aria-hidden className="text-[var(--mypage-info-icon-symbol)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium tracking-[0.08em] text-[var(--mypage-info-item-label)]">{label}</p>
                  <p className="mt-1 truncate text-[15px] font-semibold text-[var(--mypage-info-item-value)]">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="mx-auto mt-[var(--mypage-logout-gap)] flex w-fit items-center justify-center px-0.5 py-2 text-[length:var(--mypage-logout-font-size)] leading-[1.4] font-medium text-[var(--mypage-logout-text)] underline [text-decoration-thickness:var(--mypage-logout-underline-thickness)] [text-underline-offset:var(--mypage-logout-underline-offset)] transition hover:text-[var(--mypage-logout-text-hover)]"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}

export default MyPage;
