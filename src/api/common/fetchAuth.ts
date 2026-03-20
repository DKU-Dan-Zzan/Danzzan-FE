import { JSON_CONTENT_TYPE } from "@/api/common/httpConstants";

type ApiErrorBody = {
  status?: number;
  message?: string;
  error?: string;
  errors?: unknown;
};

export type ApiRequestError = Error & {
  status?: number;
  errors?: unknown;
  payload?: unknown;
};

const parsePayload = async (res: Response): Promise<unknown> => {
  const text = await res.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
};

const createApiRequestError = (
  res: Response,
  payload: unknown,
): ApiRequestError => {
  const body = (payload ?? {}) as ApiErrorBody;
  const message =
    body.message ??
    body.error ??
    `요청 실패 (${res.status})`;

  const error = new Error(message) as ApiRequestError;
  error.status = body.status ?? res.status;
  error.errors = body.errors;
  error.payload = payload;
  return error;
};

export const parseFetchResponse = async <T>(res: Response): Promise<T> => {
  const payload = await parsePayload(res);
  if (!res.ok) {
    throw createApiRequestError(res, payload);
  }
  return payload as T;
};

const buildHeaders = (
  headers?: HeadersInit,
  accessToken?: string,
): Headers => {
  const merged = new Headers(headers);
  if (!merged.has("Content-Type")) {
    merged.set("Content-Type", JSON_CONTENT_TYPE);
  }
  if (accessToken) {
    merged.set("Authorization", `Bearer ${accessToken}`);
  }
  return merged;
};

type CreateFetchWithAuthOptions = {
  getBaseUrl: () => string;
  getAccessToken: () => string | null;
  reissueAccessToken: () => Promise<string | null>;
  sessionExpiredMessage?: string;
  credentials?: RequestCredentials;
};

export const createFetchWithAuth = ({
  getBaseUrl,
  getAccessToken,
  reissueAccessToken,
  sessionExpiredMessage = "세션이 만료되었습니다. 다시 로그인해 주세요.",
  credentials,
}: CreateFetchWithAuthOptions) => {
  return async <T>(input: string, init: RequestInit = {}): Promise<T> => {
    const base = getBaseUrl();

    const makeRequest = (accessToken?: string) =>
      fetch(`${base}${input}`, {
        ...init,
        credentials: credentials ?? init.credentials,
        headers: buildHeaders(init.headers, accessToken),
      });

    const token = getAccessToken();
    let res = await makeRequest(token ?? undefined);

    if (res.status === 401) {
      const reissued = await reissueAccessToken();
      if (!reissued) {
        throw new Error(sessionExpiredMessage);
      }
      res = await makeRequest(reissued);
    }

    return parseFetchResponse<T>(res);
  };
};

export const getErrorStatus = (error: unknown): number | null => {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }
  return null;
};
