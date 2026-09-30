// 역할: Admin Auth 관련 상태와 부수효과를 캡슐화한 훅이다.

import { useCallback, useSyncExternalStore } from "react";
import { adminAuthApi } from "@/api/app/admin/adminAuthApi";
import { authStore } from "@/store/common/authStore";
import type { AuthSession } from "@/types/common/auth.model";
import { authLogout } from "@/api/app/auth/authApi";
import { requireAdminRole } from "@/lib/app/admin/admin-auth-session";
import { AuthBoundaryError, canAccessAdminConsole, isAccessTokenExpired, resolvePermissionsFromAccessToken, resolveRoleFromAccessToken } from "@/api/common/authCore";

const setAdminSession = (session: AuthSession): void => {
  authStore.setSession(session, { refreshMode: "cookie" });
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

  const isAuthenticated = Boolean(state.tokens?.accessToken) && canAccessAdminConsole(state.role, state.permissions);

  const login = useCallback(async (studentNumber: string, password: string): Promise<void> => {
    if (!studentNumber.trim() || !password.trim()) {
      throw new Error("학번과 비밀번호를 입력해 주세요.");
    }

    const epoch = authStore.getSessionEpoch();
    let session: AuthSession;
    try {
      session = await adminAuthApi.login({
        studentId: studentNumber.trim(),
        password,
      });
    } catch (error) {
      throw new Error(resolveAdminLoginErrorMessage(error));
    }
    if (!canAccessAdminConsole(resolveRoleFromAccessToken(session.tokens.accessToken), resolvePermissionsFromAccessToken(session.tokens.accessToken))) {
      requireAdminRole(session.tokens.accessToken);
    }
    if (epoch !== authStore.getSessionEpoch()) {
      throw new AuthBoundaryError("세션이 변경되었습니다.", "AUTH_SESSION_EXPIRED", 401);
    }
    setAdminSession(session);
  }, []);

  const logout = useCallback(async () => {
    const epoch = authStore.getSessionEpoch();
    try {
      const refreshToken = authStore.getRefreshToken() ?? undefined;
      await authLogout(refreshToken);
    } finally {
      if (epoch === authStore.getSessionEpoch()) authStore.clear();
    }
  }, []);

  /** 페이지 로드 시 저장된 세션/재발급 토큰으로 세션 복구. 성공 시 true, 실패 시 false */
  const tryRestoreSession = useCallback(async (): Promise<boolean> => {
    const current = authStore.getSnapshot();
    const hasValidToken =
      current.tokens?.accessToken &&
      canAccessAdminConsole(current.role, current.permissions) &&
      !isAccessTokenExpired(current.tokens.accessToken);
    if (hasValidToken) {
      return true;
    }

    try {
      const reissued = await authStore.refreshAccessToken();
      if (!reissued) {
        return false;
      }
      if (!canAccessAdminConsole(resolveRoleFromAccessToken(reissued), resolvePermissionsFromAccessToken(reissued))) {
        requireAdminRole(reissued);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  return { isAuthenticated, login, logout, tryRestoreSession };
}
