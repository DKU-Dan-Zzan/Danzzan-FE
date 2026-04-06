// 역할: 티켓팅 인증 세션 조회/갱신/로그아웃을 React Hook 인터페이스로 제공합니다.
import { useCallback, useSyncExternalStore } from "react";
import { authApi } from "@/api/ticketing/authApi";
import { adminAuthApi } from "@/api/ticketing/adminAuthApi";
import { authLogout, userLogout } from "@/api/ticketing/authLogoutApi";
import { authStore } from "@/store/common/authStore";
import type { AuthCredentials, UserRole } from "@/types/ticketing/model/auth.model";

export const useAuth = () => {
  const state = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot,
  );

  const isAuthenticated = Boolean(state.tokens?.accessToken);

  const login = useCallback(
    async (payload: AuthCredentials, role: UserRole) => {
      if (role === "admin") {
        const session = await adminAuthApi.login(payload);
        authStore.setSession(session, "admin");
        return session;
      }

      const session = await authApi.login(payload);
      authStore.setSession(session, role);
      return session;
    },
    [],
  );

  const refresh = useCallback(async () => {
    const refreshed = await authStore.refreshAccessToken();
    if (!refreshed) {
      throw new Error("세션이 만료되었습니다. 다시 로그인해 주세요.");
    }
    return authStore.getSnapshot();
  }, []);

  const logout = useCallback(() => {
    const currentState = authStore.getSnapshot();
    if (currentState.role === "student") {
      const accessToken = currentState.tokens?.accessToken ?? "";
      void userLogout(accessToken);
    } else {
      void authLogout();
    }
    authStore.clear();
  }, []);

  return {
    session: state,
    isAuthenticated,
    role: state.role,
    login,
    refresh,
    logout,
  };
};
