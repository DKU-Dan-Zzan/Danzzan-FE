// 역할: Admin Auth 관련 상태와 부수효과를 캡슐화한 훅이다.

import { useCallback, useSyncExternalStore } from "react";
import { adminAuthApi } from "@/api/app/admin/adminAuthApi";
import { authStore } from "@/store/common/authStore";
import type { AuthSession } from "@/types/common/auth.model";
import { authLogout } from "@/api/app/auth/authApi";
import { requireAdminRole } from "@/lib/app/admin/admin-auth-session";

const setAdminSession = (session: AuthSession): void => {
  authStore.setSession(session, "admin");
};

export function useAdminAuth() {
  const state = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot,
  );

  const isAuthenticated = Boolean(state.tokens?.accessToken) && state.role === "admin";

  const login = useCallback(async (studentNumber: string, password: string): Promise<void> => {
    if (!studentNumber.trim() || !password.trim()) {
      throw new Error("학번과 비밀번호를 입력해 주세요.");
    }

    const session = await adminAuthApi.login({
      studentId: studentNumber.trim(),
      password,
    });
    requireAdminRole(session.tokens.accessToken);
    setAdminSession(session);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authLogout();
    } finally {
      authStore.clear();
    }
  }, []);

  /** 페이지 로드 시 저장된 세션/재발급 토큰으로 세션 복구. 성공 시 true, 실패 시 false */
  const tryRestoreSession = useCallback(async (): Promise<boolean> => {
    const current = authStore.getSnapshot();
    if (current.tokens?.accessToken && current.role === "admin") {
      return true;
    }

    try {
      const reissued = await authStore.refreshAccessToken();
      if (!reissued) {
        return false;
      }
      requireAdminRole(reissued);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { isAuthenticated, login, logout, tryRestoreSession };
}
