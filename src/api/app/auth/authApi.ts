// 역할: auth api 관련 HTTP 요청 함수를 제공하는 API 어댑터다.

import { getApiBaseUrl } from "@/api/common/baseUrl";
import { parseFetchResponse } from "@/api/common/fetchAuth";
import { JSON_HEADERS } from "@/api/common/httpConstants";

export const getBaseUrl = () => getApiBaseUrl();

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

export async function authLogin(body: LoginRequest): Promise<LoginResponse> {
  const base = getBaseUrl();

  const res = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: JSON_HEADERS,
    credentials: "include",
    body: JSON.stringify(body),
  });

  return parseFetchResponse<LoginResponse>(res);
}

/** 학생 로그아웃 — tokenVersion 무효화 (Authorization 헤더로 accessToken 전송 필요) */
export async function userLogout(accessToken: string): Promise<void> {
  const base = getBaseUrl();
  if (!base) return;

  try {
    await fetch(`${base}/user/logout`, {
      method: "POST",
      headers: {
        ...JSON_HEADERS,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    // 로그아웃 실패해도 클라이언트 세션은 제거
  }
}

export async function authLogout(refreshToken?: string): Promise<void> {
  const base = getBaseUrl();
  if (!base) return;

  try {
    await fetch(`${base}/auth/logout`, {
      method: "POST",
      headers: JSON_HEADERS,
      credentials: "include",
      body: JSON.stringify({ refreshToken: refreshToken ?? "" }),
    });
  } catch {
    // 로그아웃 실패해도 클라이언트 세션은 제거
  }
}

/** 학생 회원 탈퇴 — accessToken을 즉시 무효화하고 서버 세션도 정리한다. */
export async function withdrawUser(accessToken: string): Promise<void> {
  const base = getBaseUrl();

  const res = await fetch(`${base}/user/me`, {
    method: "DELETE",
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  return parseFetchResponse<void>(res);
}

export async function authReissue(refreshToken?: string): Promise<ReissueResponse> {
  const base = getBaseUrl();

  const res = await fetch(`${base}/auth/reissue`, {
    method: "POST",
    headers: JSON_HEADERS,
    credentials: "include",
    body: JSON.stringify({ refreshToken: refreshToken ?? "" }),
  });

  return parseFetchResponse<ReissueResponse>(res);
}
