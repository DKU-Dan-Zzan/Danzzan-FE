import { useNavigate } from "react-router-dom";
import { useEffect, useSyncExternalStore } from "react";
import { authStore } from "@/store/ticketing/authStore";
import { authApi } from "@/api/ticketing/authApi";
import { GraduationCap, IdCard, User } from "lucide-react";

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
        const freshUser = await authApi.me();
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
      <div className="mypage-page-root is-guest relative flex min-h-full flex-col items-center justify-center overflow-hidden px-6 py-[100px]">
        <div className="mypage-page-glow is-top pointer-events-none absolute -top-20 -right-14 h-52 w-52 rounded-full blur-3xl" />
        <div className="mypage-page-glow is-bottom pointer-events-none absolute -bottom-20 -left-14 h-52 w-52 rounded-full blur-3xl" />

        <div className="mypage-guest-card relative flex w-full max-w-sm flex-col items-center gap-5 px-6 py-8 text-center">
          <div className="mypage-guest-icon flex h-20 w-20 items-center justify-center">
            <User size={38} className="mypage-guest-icon-symbol" />
          </div>
          <div className="space-y-2">
            <p className="mypage-guest-overline text-[11px] font-semibold tracking-[0.18em]">STUDENT PROFILE</p>
            <h2 className="mypage-guest-title text-xl font-extrabold tracking-tight">내정보를 보려면 로그인해 주세요</h2>
            <p className="mypage-guest-description text-sm leading-relaxed">로그인 후 예매 내역과 계정 정보를 확인할 수 있어요.</p>
          </div>

          <button
            onClick={() => navigate("/ticket/login")}
            className="mypage-guest-cta h-[52px] w-full rounded-2xl text-sm font-bold transition hover:brightness-95"
          >
            로그인 / 회원가입하러 가기
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
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
    <div className="mypage-page-root relative min-h-full overflow-hidden">
      <div className="mypage-page-glow is-top pointer-events-none absolute -top-24 -right-16 h-60 w-60 rounded-full blur-3xl" />
      <div className="mypage-page-glow is-bottom pointer-events-none absolute -bottom-24 -left-16 h-60 w-60 rounded-full blur-3xl" />

      <div className="relative px-4 pt-[var(--app-header-first-card-gap)]">
        <div className="mypage-portal-card">
          <div className="mypage-portal-content">
            <div>
              <p className="mypage-portal-overline">DANFESTA PORTAL</p>
              <h1 className="mypage-portal-name">{user?.name ?? "-"}</h1>
              <p className="mypage-portal-subtitle">단국대학교 재학생</p>
            </div>
            <div className="mypage-portal-avatar">
              <User size={28} className="mypage-portal-avatar-icon" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-[430px] px-4 pt-5">
        <div className="mypage-info-card overflow-hidden rounded-[28px]">
          <div className="mypage-info-card-header px-5 py-4">
            <p className="mypage-info-overline text-[11px] font-semibold tracking-[0.16em]">MY INFO</p>
            <h2 className="mypage-info-title mt-1 text-[18px] font-bold tracking-tight">학적 정보</h2>
          </div>

          <div className="mypage-info-list">
            {infoItems.map(({ label, value, icon: Icon }) => (
              <div key={label} className="mypage-info-row flex items-center gap-4 px-5 py-4">
                <div className="mypage-info-icon-glass">
                  <Icon size={18} aria-hidden className="mypage-info-icon-symbol" />
                </div>
                <div className="min-w-0">
                  <p className="mypage-info-item-label text-[11px] font-medium tracking-[0.08em]">{label}</p>
                  <p className="mypage-info-item-value mt-1 truncate text-[15px] font-semibold">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="mypage-logout-button transition"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}

export default MyPage;
