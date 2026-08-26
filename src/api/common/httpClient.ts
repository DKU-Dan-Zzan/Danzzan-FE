// 역할: http client HTTP 클라이언트 인스턴스와 공통 인터셉터를 구성한다.

import axios from "axios";
import {
  isAuthBoundaryError,
  withAuthRetry,
} from "@/api/common/authCore";
import { getErrorStatus } from "@/api/common/fetchAuth";
import { JSON_HEADERS } from "@/api/common/httpConstants";
import { getCurrentLanguage } from "@/store/common/languageStore";

export type RequestParams = Record<string, string | number | boolean | null | undefined>;

export type RequestOptions = {
  params?: RequestParams;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
};

export class HttpError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

type LanguageAwareConfig = {
  method?: string;
  params?: Record<string, unknown>;
  [key: string]: unknown;
};

/**
 * 영어 표시 중인 GET 요청에 lang=en을 붙인다.
 * 한국어는 BE 기본값이라 파라미터를 생략해 캐시 키를 단순하게 유지한다.
 * 호출자가 lang을 명시했다면 존중한다.
 */
export const attachLanguageParam = <T extends LanguageAwareConfig>(
  config: T,
): T & { params: Record<string, unknown> } => {
  const params = { ...(config.params ?? {}) };
  const method = (config.method ?? "get").toLowerCase();

  if (method === "get" && params.lang === undefined) {
    const language = getCurrentLanguage();
    if (language === "en") {
      params.lang = "en";
    }
  }

  return { ...config, params };
};

export const createHttpClient = (options: {
  baseUrl: string;
  getAccessToken?: () => string | null;
  refreshAccessToken?: () => Promise<string | null>;
  clearSession?: () => void | Promise<void>;
  refreshKey?: string;
  sessionExpiredMessage?: string;
  forbiddenMessage?: string;
}) => {
  const {
    baseUrl,
    getAccessToken,
    refreshAccessToken,
    clearSession,
    refreshKey,
    sessionExpiredMessage,
    forbiddenMessage,
  } = options;

  if (!baseUrl) {
    throw new Error("API base URL is not configured.");
  }

  const instance = axios.create({
    baseURL: baseUrl,
    headers: { ...JSON_HEADERS },
    withCredentials: true,
  });

  instance.interceptors.request.use((config) => {
    const { params } = attachLanguageParam({ method: config.method, params: config.params });
    return { ...config, params };
  });

  const toHttpError = (error: unknown): HttpError => {
    if (error instanceof HttpError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      return new HttpError(
        `Request failed with status ${error.response?.status ?? "unknown"}`,
        error.response?.status ?? 500,
        error.response?.data,
      );
    }

    const status = getErrorStatus(error);
    if (status !== null) {
      return new HttpError(`Request failed with status ${status}`, status, error);
    }

    return new HttpError("Request failed with status unknown", 500, error);
  };

  const readAxiosStatus = (error: unknown): number | null => {
    if (axios.isAxiosError(error)) {
      return error.response?.status ?? null;
    }
    return getErrorStatus(error);
  };

  const hasAuthorizationHeader = (headers: Record<string, unknown>): boolean => {
    return Object.keys(headers).some((key) => key.toLowerCase() === "authorization");
  };

  const requestWithAuth = async <T>(config: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    path: string;
    requestOptions?: RequestOptions;
    body?: unknown;
  }): Promise<T> => {
    try {
      return await withAuthRetry<T>({
        getAccessToken: () => getAccessToken?.() ?? null,
        refreshAccessToken,
        refreshKey,
        onSessionExpired: clearSession,
        sessionExpiredMessage,
        forbiddenMessage,
        readStatus: readAxiosStatus,
        execute: async (accessToken, context) => {
          const isRetry = context.isRetry;
          void isRetry;
          const headers = {
            ...(config.requestOptions?.headers ?? {}),
          } as Record<string, string>;

          if (accessToken && !hasAuthorizationHeader(headers)) {
            headers.Authorization = `Bearer ${accessToken}`;
          }

          const response = await instance.request<T>({
            url: config.path,
            method: config.method,
            data: config.body,
            params: config.requestOptions?.params,
            signal: config.requestOptions?.signal,
            headers,
          });

          return response.data;
        },
      });
    } catch (error) {
      if (isAuthBoundaryError(error)) {
        throw error;
      }
      throw toHttpError(error);
    }
  };

  return {
    get: <T>(path: string, requestOptions?: RequestOptions): Promise<T> =>
      requestWithAuth<T>({ method: "GET", path, requestOptions }),
    post: <T>(path: string, body?: unknown, requestOptions?: RequestOptions): Promise<T> =>
      requestWithAuth<T>({ method: "POST", path, body, requestOptions }),
    put: <T>(path: string, body?: unknown, requestOptions?: RequestOptions): Promise<T> =>
      requestWithAuth<T>({ method: "PUT", path, body, requestOptions }),
    patch: <T>(path: string, body?: unknown, requestOptions?: RequestOptions): Promise<T> =>
      requestWithAuth<T>({ method: "PATCH", path, body, requestOptions }),
    delete: <T>(path: string, requestOptions?: RequestOptions): Promise<T> =>
      requestWithAuth<T>({ method: "DELETE", path, requestOptions }),
  };
};
