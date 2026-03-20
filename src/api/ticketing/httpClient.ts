import axios from "axios";
import {
  isAuthBoundaryError,
  withAuthRetry,
} from "@/api/common/authCore";
import { getErrorStatus } from "@/api/common/fetchAuth";
import { JSON_HEADERS } from "@/api/common/httpConstants";

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
        execute: async (accessToken, _context) => {
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
