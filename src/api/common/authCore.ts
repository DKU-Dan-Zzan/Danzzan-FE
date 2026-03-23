// 역할: 인증 갱신, 재시도, 토큰 저장을 포함한 공통 인증 흐름을 제공한다.

import { logAuthWarn, maskToken } from "@/api/common/authLogger";

export type AuthRole = "student" | "admin";

export type AuthErrorCode =
  | "AUTH_UNAUTHORIZED"
  | "AUTH_FORBIDDEN"
  | "AUTH_SESSION_EXPIRED"
  | "AUTH_REFRESH_FAILED";

export class AuthBoundaryError extends Error {
  code: AuthErrorCode;
  status?: number;
  cause?: unknown;

  constructor(message: string, code: AuthErrorCode, status?: number, cause?: unknown) {
    super(message);
    this.name = "AuthBoundaryError";
    this.code = code;
    this.status = status;
    this.cause = cause;
  }
}

export const isAuthBoundaryError = (error: unknown): error is AuthBoundaryError => {
  return error instanceof AuthBoundaryError;
};

export const getAuthErrorCode = (error: unknown): AuthErrorCode | null => {
  return isAuthBoundaryError(error) ? error.code : null;
};

const parseJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) {
      return null;
    }

    // JWT payload is base64url encoded and may be unpadded.
    const base64 = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64.padEnd(base64.length + padLength, "=");

    const decoded = JSON.parse(atob(padded)) as Record<string, unknown>;
    return decoded;
  } catch {
    return null;
  }
};

const normalizeRoleClaim = (role: unknown): AuthRole | null => {
  if (role === "admin" || role === "ROLE_ADMIN") {
    return "admin";
  }
  if (role === "student" || role === "ROLE_USER" || role === "user") {
    return "student";
  }
  return null;
};

const toExpiryEpochMs = (expClaim: unknown): number | null => {
  if (typeof expClaim === "number" && Number.isFinite(expClaim)) {
    return expClaim * 1000;
  }

  if (typeof expClaim === "string" && expClaim.trim()) {
    const parsed = Number(expClaim);
    if (Number.isFinite(parsed)) {
      return parsed * 1000;
    }
  }

  return null;
};

export const resolveRoleFromAccessToken = (token: string | null | undefined): AuthRole | null => {
  if (!token) {
    return null;
  }

  const payload = parseJwtPayload(token);
  if (!payload) {
    return null;
  }

  const directRole = normalizeRoleClaim(payload.role);
  if (directRole) {
    return directRole;
  }

  const authorities = payload.authorities;
  if (Array.isArray(authorities)) {
    for (const authority of authorities) {
      const normalized = normalizeRoleClaim(authority);
      if (normalized) {
        return normalized;
      }
    }
  }

  return null;
};

export const isAccessTokenExpired = (
  token: string | null | undefined,
  nowMs = Date.now(),
): boolean => {
  if (!token) {
    return true;
  }

  const payload = parseJwtPayload(token);
  if (!payload) {
    return false;
  }

  const expiry = toExpiryEpochMs(payload.exp);
  if (expiry == null) {
    return false;
  }

  return expiry <= nowMs;
};

export const hasRequiredRole = (
  requiredRole: AuthRole,
  currentRole: AuthRole | null,
): boolean => {
  if (!currentRole) {
    return false;
  }

  if (requiredRole === "student") {
    return currentRole === "student" || currentRole === "admin";
  }

  return currentRole === "admin";
};

type RefreshQueueOptions = {
  key?: string;
  refresh: () => Promise<string | null>;
};

const refreshFlights = new Map<string, Promise<string | null>>();
const DEFAULT_REFRESH_KEY = "auth.boundary.default";

export const refreshIfNeeded = async ({
  key = DEFAULT_REFRESH_KEY,
  refresh,
}: RefreshQueueOptions): Promise<string | null> => {
  const inFlight = refreshFlights.get(key);
  if (inFlight) {
    return inFlight;
  }

  const task = (async () => {
    try {
      const refreshedToken = await refresh();
      logAuthWarn("refresh-complete", {
        key,
        success: Boolean(refreshedToken),
        refreshedToken: maskToken(refreshedToken),
      });
      return refreshedToken;
    } catch (error) {
      logAuthWarn("refresh-failed", {
        key,
      });
      throw error;
    } finally {
      refreshFlights.delete(key);
    }
  })();

  refreshFlights.set(key, task);
  return task;
};

type AuthRetryContext = {
  isRetry: boolean;
};

type WithAuthRetryOptions<T> = {
  getAccessToken: () => string | null;
  execute: (accessToken: string | null, context: AuthRetryContext) => Promise<T>;
  readStatus: (error: unknown) => number | null;
  refreshAccessToken?: () => Promise<string | null>;
  refreshKey?: string;
  onSessionExpired?: () => void | Promise<void>;
  onForbidden?: () => void | Promise<void>;
  sessionExpiredMessage?: string;
  forbiddenMessage?: string;
};

const defaultSessionExpiredMessage = "세션이 만료되었습니다. 다시 로그인해 주세요.";
const defaultForbiddenMessage = "권한이 없습니다.";

const throwForbiddenError = (message: string, cause: unknown) => {
  throw new AuthBoundaryError(message, "AUTH_FORBIDDEN", 403, cause);
};

const throwSessionExpiredError = (message: string, cause: unknown) => {
  throw new AuthBoundaryError(message, "AUTH_SESSION_EXPIRED", 401, cause);
};

export const withAuthRetry = async <T>({
  getAccessToken,
  execute,
  readStatus,
  refreshAccessToken,
  refreshKey,
  onSessionExpired,
  onForbidden,
  sessionExpiredMessage = defaultSessionExpiredMessage,
  forbiddenMessage = defaultForbiddenMessage,
}: WithAuthRetryOptions<T>): Promise<T> => {
  try {
    return await execute(getAccessToken(), { isRetry: false });
  } catch (firstError) {
    const firstStatus = readStatus(firstError);

    if (firstStatus === 403) {
      await onForbidden?.();
      throwForbiddenError(forbiddenMessage, firstError);
    }

    if (firstStatus !== 401 || !refreshAccessToken) {
      throw firstError;
    }

    let refreshedToken: string | null = null;
    try {
      refreshedToken = await refreshIfNeeded({
        key: refreshKey,
        refresh: refreshAccessToken,
      });
    } catch (refreshError) {
      await onSessionExpired?.();
      throw new AuthBoundaryError(
        sessionExpiredMessage,
        "AUTH_REFRESH_FAILED",
        401,
        refreshError,
      );
    }

    if (!refreshedToken) {
      await onSessionExpired?.();
      throwSessionExpiredError(sessionExpiredMessage, firstError);
    }

    try {
      return await execute(refreshedToken, { isRetry: true });
    } catch (retryError) {
      const retryStatus = readStatus(retryError);
      if (retryStatus === 403) {
        await onForbidden?.();
        throwForbiddenError(forbiddenMessage, retryError);
      }
      if (retryStatus === 401) {
        await onSessionExpired?.();
        throwSessionExpiredError(sessionExpiredMessage, retryError);
      }
      throw retryError;
    }
  }
};
