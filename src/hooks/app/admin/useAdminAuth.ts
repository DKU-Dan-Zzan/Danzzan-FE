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

export function resolveAdminLoginErrorMessage(error: unknown): string {
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : null;

  if (status === 401) {
    return "학번 또는 비밀번호가 올바르지 않습니다.";
  }

  if (status === 403) {
    return "관리자 권한이 없는 계정입니다.";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "로그인에 실패했습니다.";
}

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

    let session: AuthSession;
    try {
      session = await adminAuthApi.login({
        studentId: studentNumber.trim(),
        password,
      });
    } catch (error) {
      throw new Error(resolveAdminLoginErrorMessage(error));
    }
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
