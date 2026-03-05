import { useNavigate } from "react-router-dom";
import { useSyncExternalStore } from "react";
import { authStore } from "@/store/ticketing/authStore";
import { GraduationCap, IdCard, LogOut, User } from "lucide-react";

function MyPage() {
  const navigate = useNavigate();
  const session = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot,
  );

  const isLoggedIn = !!session.tokens?.accessToken && session.role === "student";

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-6 pb-[100px]">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
            <User size={40} className="text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">로그인이 안되어 있습니다</h2>
          <p className="text-sm text-gray-500">티켓팅 서비스 이용을 위해<br />로그인이 필요합니다.</p>
        </div>
        <button
          onClick={() => navigate("/ticket/login")}
          className="w-full max-w-xs rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white shadow-sm"
        >
          로그인 / 회원가입하러 가기
        </button>
      </div>
    );
  }

  const user = session.user;

  const handleLogout = () => {
    authStore.clear();
    navigate("/ticket/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-[100px]">
      <div className="bg-blue-600 px-6 pt-12 pb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <User size={32} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-blue-100">단국대학교 재학생</p>
            <h1 className="text-2xl font-bold text-white">{user?.name ?? "-"}</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[430px] px-4 pt-6">
        <div className="rounded-2xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">내 정보</p>
          </div>

          <div className="divide-y divide-gray-100">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                <IdCard size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">학번</p>
                <p className="font-semibold text-gray-900">{user?.studentId ?? "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                <GraduationCap size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">단과대학</p>
                <p className="font-semibold text-gray-900">{user?.college || "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                <GraduationCap size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">학과</p>
                <p className="font-semibold text-gray-900">{user?.department || "-"}</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-semibold text-red-500 shadow-sm"
        >
          <LogOut size={18} />
          티켓팅 로그아웃
        </button>
      </div>
    </div>
  );
}

export default MyPage;
