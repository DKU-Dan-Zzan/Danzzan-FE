import { useNavigate } from "react-router-dom";
import { useEffect, useSyncExternalStore } from "react";
import { authStore } from "@/store/ticketing/authStore";
import { authApi } from "@/api/ticketing/authApi";
import { GraduationCap, IdCard, LogOut, User } from "lucide-react";

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
      <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f3f7ff_0%,#ecf2ff_44%,#f8fbff_100%)] px-6 py-[100px]">
        <div className="pointer-events-none absolute -top-20 -right-14 h-52 w-52 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-14 h-52 w-52 rounded-full bg-blue-200/20 blur-3xl" />

        <div className="relative flex w-full max-w-sm flex-col items-center gap-5 rounded-[28px] border border-blue-100/90 bg-white/85 px-6 py-8 text-center shadow-[0_20px_45px_-24px_rgba(37,99,235,0.42)] backdrop-blur-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/60 bg-[linear-gradient(145deg,#4f8df8_0%,#2563eb_100%)] shadow-[0_14px_24px_-16px_rgba(37,99,235,0.65)]">
            <User size={38} className="text-white" />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-blue-500/80">STUDENT PROFILE</p>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">내정보를 보려면 로그인해 주세요</h2>
            <p className="text-sm leading-relaxed text-slate-500">로그인 후 예매 내역과 계정 정보를 확인할 수 있어요.</p>
          </div>

          <button
            onClick={() => navigate("/ticket/login")}
            className="h-[52px] w-full rounded-2xl bg-[linear-gradient(145deg,#3b82f6_0%,#2563eb_100%)] text-sm font-bold text-white shadow-[0_14px_24px_-16px_rgba(37,99,235,0.72)] transition hover:brightness-95"
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
    <div className="relative min-h-full overflow-hidden bg-[linear-gradient(180deg,#f3f7ff_0%,#ecf2ff_44%,#f8fbff_100%)] pb-[100px]">
      <div className="pointer-events-none absolute -top-24 -right-16 h-60 w-60 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-blue-200/20 blur-3xl" />

      <div className="relative px-4 pt-5">
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
        <div className="overflow-hidden rounded-[28px] border border-blue-100/90 bg-white/84 shadow-[0_18px_38px_-24px_rgba(15,23,42,0.34)] backdrop-blur-sm">
          <div className="border-b border-blue-100/80 bg-[linear-gradient(180deg,rgba(239,246,255,0.9)_0%,rgba(255,255,255,0.72)_100%)] px-5 py-4">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-blue-500/80">MY INFO</p>
            <h2 className="mt-1 text-[18px] font-bold tracking-tight text-slate-900">학적 정보</h2>
          </div>

          <div className="divide-y divide-blue-100/80">
            {infoItems.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-4">
                <div className="mypage-info-icon-glass">
                  <Icon size={18} aria-hidden className="mypage-info-icon-symbol" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium tracking-[0.08em] text-slate-400">{label}</p>
                  <p className="mt-1 truncate text-[15px] font-semibold text-slate-900">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white/86 text-sm font-semibold text-slate-700 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.25)] backdrop-blur-sm transition hover:bg-slate-50/80"
        >
          <LogOut size={18} />
          로그아웃
        </button>
      </div>
    </div>
  );
}

export default MyPage;
