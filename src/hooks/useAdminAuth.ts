import { useCallback, useState } from "react";
import { authLogin, authLogout, authReissue } from "../api/auth";

/** Access Token은 스펙대로 메모리에만 보관 (XSS 시 탈취 위험 감소) */
let inMemoryAccessToken: string | null = null;

function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

function setAccessToken(token: string): void {
  inMemoryAccessToken = token;
}

function clearAccessToken(): void {
  inMemoryAccessToken = null;
}

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(inMemoryAccessToken)
  );

  const login = useCallback(async (studentNumber: string, password: string): Promise<void> => {
    if (!studentNumber.trim() || !password.trim()) {
      throw new Error("학번과 비밀번호를 입력해 주세요.");
    }

    const res = await authLogin({ studentNumber: studentNumber.trim(), password });
    setAccessToken(res.accessToken);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    clearAccessToken();
    setIsAuthenticated(false);
  }, []);

  /** 페이지 로드 시 쿠키(refreshToken)로 세션 복구. 성공 시 true, 실패 시 false */
  const tryRestoreSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await authReissue();
      setAccessToken(res.accessToken);
      setIsAuthenticated(true);
      return true;
    } catch {
      clearAccessToken();
      return false;
    }
  }, []);

  return { isAuthenticated, login, logout, tryRestoreSession };
}

export function getAdminSession(): string | null {
  return getAccessToken();
}

export function getAdminAccessToken(): string | null {
  return getAccessToken();
}

/** Access 만료(401) 시 재발급 후 새 토큰 반환. 실패 시 null (로그인 페이지 이동 권장) */
export async function reissueAdminToken(): Promise<string | null> {
  try {
    const res = await authReissue();
    setAccessToken(res.accessToken);
    return res.accessToken;
  } catch {
    clearAccessToken();
    return null;
  }
}
