import { useCallback, useSyncExternalStore } from "react";
import { hasRequiredRole, resolveRoleFromAccessToken } from "@/api/common/authCore";
import { adminAuthApi } from "@/api/ticketing/adminAuthApi";
import { authStore } from "@/store/ticketing/authStore";
import type { AuthSession } from "@/types/ticketing/model/auth.model";
import { authLogout } from "../api/auth";

const requireAdminRole = (accessToken: string): void => {
  const role = resolveRoleFromAccessToken(accessToken);
  if (!hasRequiredRole("admin", role)) {
    throw new Error("관리자 권한이 없는 계정입니다.");
  }
};

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

export function getAdminSession(): string | null {
  return authStore.getRole() === "admin" ? authStore.getAccessToken() : null;
}

export function clearAdminSession(): void {
  authStore.clear();
}

export function getAdminAccessToken(): string | null {
  return authStore.getRole() === "admin" ? authStore.getAccessToken() : null;
}

/** Access 만료(401) 시 재발급 후 새 토큰 반환. 실패 시 null (로그인 페이지 이동 권장) */
export async function reissueAdminToken(): Promise<string | null> {
  const reissued = await authStore.refreshAccessToken();
  if (!reissued) {
    return null;
  }

  try {
    requireAdminRole(reissued);
    return reissued;
  } catch {
    authStore.clear();
    return null;
  }
}
