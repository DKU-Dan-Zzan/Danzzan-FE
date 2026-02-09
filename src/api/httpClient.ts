import axios, { AxiosError, type AxiosRequestConfig } from "axios";

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
}) => {
  const { baseUrl, getAccessToken } = options;

  if (!baseUrl) {
    throw new Error("API base URL is not configured.");
  }

  const instance = axios.create({
    baseURL: baseUrl,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  instance.interceptors.request.use((config) => {
    const token = getAccessToken?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response.data,
    (error: AxiosError) => {
      const message = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;

      throw new HttpError(
        `Request failed with status ${error.response?.status ?? "unknown"}`,
        error.response?.status ?? 500,
        error.response?.data,
      );
    },
  );

  return {
    get: <T>(path: string, requestOptions?: RequestOptions) =>
      instance.get<T>(path, requestOptions),
    post: <T>(path: string, body?: unknown, requestOptions?: RequestOptions) =>
      instance.post<T>(path, body, requestOptions),
    put: <T>(path: string, body?: unknown, requestOptions?: RequestOptions) =>
      instance.put<T>(path, body, requestOptions),
    patch: <T>(path: string, body?: unknown, requestOptions?: RequestOptions) =>
      instance.patch<T>(path, body, requestOptions),
    delete: <T>(path: string, requestOptions?: RequestOptions) =>
      instance.delete<T>(path, requestOptions),
  };
};
