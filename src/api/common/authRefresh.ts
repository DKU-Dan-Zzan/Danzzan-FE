import { getApiBaseUrl } from "@/api/common/baseUrl";
import { parseFetchResponse } from "@/api/common/fetchAuth";
import { JSON_HEADERS } from "@/api/common/httpConstants";

type RefreshPayload = {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number | null;
  tokens?: {
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number | null;
  };
};

export type RefreshedTokenSet = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number | null;
};

const readTokenSet = (payload: RefreshPayload): RefreshedTokenSet => {
  const accessToken = payload.tokens?.accessToken ?? payload.accessToken ?? "";
  const refreshToken = payload.tokens?.refreshToken ?? payload.refreshToken;
  const expiresIn = payload.tokens?.expiresIn ?? payload.expiresIn ?? null;

  if (!accessToken) {
    throw new Error("재발급 응답에 accessToken이 없습니다.");
  }

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
};

export const refreshAccessTokenWithCookie = async (): Promise<RefreshedTokenSet> => {
  const base = getApiBaseUrl();

  const res = await fetch(`${base}/auth/reissue`, {
    method: "POST",
    headers: JSON_HEADERS,
    credentials: "include",
  });

  const payload = await parseFetchResponse<RefreshPayload>(res);
  return readTokenSet(payload);
};

export const refreshAccessTokenWithToken = async (
  refreshToken: string,
): Promise<RefreshedTokenSet> => {
  if (!refreshToken.trim()) {
    throw new Error("재발급 토큰이 없습니다.");
  }

  const base = getApiBaseUrl();
  const res = await fetch(`${base}/user/reissue`, {
    method: "POST",
    headers: JSON_HEADERS,
    credentials: "include",
    body: JSON.stringify({ refreshToken }),
  });

  const payload = await parseFetchResponse<RefreshPayload>(res);
  return readTokenSet(payload);
};
