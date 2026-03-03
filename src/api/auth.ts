export const getBaseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()?.replace(/\/$/, "") ?? "http://localhost:8080";

export type LoginRequest = {
  studentNumber: string;
  password: string;
};

/** 로그인/재발급 성공 시 body. refreshToken은 Set-Cookie로 전달됨 */
export type LoginResponse = {
  accessToken: string;
};

export type ReissueResponse = {
  accessToken: string;
};

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T) : ({} as T);

  if (!res.ok) {
    const message =
      (data as { message?: string })?.message ??
      (data as { error?: string })?.error ??
      `요청 실패 (${res.status})`;
    throw new Error(message);
  }

  return data;
}

export async function authLogin(body: LoginRequest): Promise<LoginResponse> {
  const base = getBaseUrl();

  const res = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  return handleResponse<LoginResponse>(res);
}

/** Body 없음. 쿠키(refreshToken)만 credentials: 'include'로 전송. 서버가 Set-Cookie로 쿠키 삭제 */
export async function authLogout(): Promise<void> {
  const base = getBaseUrl();
  if (!base) return;

  try {
    await fetch(`${base}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
  } catch {
    // 로그아웃 실패해도 클라이언트 세션은 제거
  }
}

/** 리프레시 토큰은 백엔드에서 쿠키로 관리하므로 body 없이 credentials: 'include'로 호출 */
export async function authReissue(): Promise<ReissueResponse> {
  const base = getBaseUrl();

  const res = await fetch(`${base}/auth/reissue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  return handleResponse<ReissueResponse>(res);
}
