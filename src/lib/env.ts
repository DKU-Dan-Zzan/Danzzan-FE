// 역할: 환경 변수 읽기와 필수 키 검증 유틸을 제공한다.

export type BackendTarget = "serverdb" | "compose";

const DEFAULT_BACKEND_TARGET: BackendTarget = "serverdb";
const DEFAULT_FALLBACK_BASE_URL = "http://127.0.0.1:8080";
const DEV_PROXY_BASE_URL = "/api";

const normalizeHostname = (value?: string): string => {
  const normalized = normalizeEnvValue(value);
  if (!normalized) {
    return "";
  }

  try {
    return new URL(normalized).hostname.toLowerCase();
  } catch {
    if (normalized.startsWith("[")) {
      const bracketEnd = normalized.indexOf("]");
      if (bracketEnd > 0) {
        return normalized.slice(1, bracketEnd).toLowerCase();
      }
    }
    return normalized.split(":")[0].toLowerCase();
  }
};

const isLoopbackHost = (hostname: string): boolean => {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.startsWith("127.")
  );
};

const rewriteLoopbackExplicitUrl = (
  explicitUrl: string,
  runtimeHost?: string,
): string => {
  const runtimeHostname = normalizeHostname(runtimeHost);
  if (!runtimeHostname || isLoopbackHost(runtimeHostname)) {
    return explicitUrl;
  }

  try {
    const parsedExplicitUrl = new URL(explicitUrl);
    if (!isLoopbackHost(parsedExplicitUrl.hostname)) {
      return explicitUrl;
    }

    return DEV_PROXY_BASE_URL;
  } catch {
    return explicitUrl;
  }
};

export const normalizeEnvValue = (value?: string): string => {
  return value?.trim() ?? "";
};

export const resolveBackendTarget = (value?: string): BackendTarget => {
  return value === "compose" ? "compose" : DEFAULT_BACKEND_TARGET;
};

type ResolveApiBaseUrlOptions = {
  primary?: string;
  legacy?: string;
  backendTarget?: BackendTarget;
  runtimeHost?: string;
  fallbackBaseUrl?: string;
};

/**
 * API base URL 우선순위
 * 1) primary (VITE_API_BASE_URL)
 * 2) legacy (VITE_API_URL)
 * 3) runtimeHost + backendTarget(serverdb=8080, compose=8081)
 * 4) fallbackBaseUrl (기본값: http://127.0.0.1:8080)
 */
export const resolveApiBaseUrl = ({
  primary,
  legacy,
  backendTarget = DEFAULT_BACKEND_TARGET,
  runtimeHost,
  fallbackBaseUrl = DEFAULT_FALLBACK_BASE_URL,
}: ResolveApiBaseUrlOptions): string => {
  const runtimeHostCandidate =
    normalizeEnvValue(runtimeHost) ||
    (typeof window !== "undefined" ? window.location.hostname : "");

  const explicit = normalizeEnvValue(primary) || normalizeEnvValue(legacy);
  if (explicit) {
    return rewriteLoopbackExplicitUrl(explicit, runtimeHostCandidate);
  }

  const host = normalizeHostname(runtimeHostCandidate);

  if (host) {
    const port = backendTarget === "compose" ? 8081 : 8080;
    return `http://${host}:${port}`;
  }

  return fallbackBaseUrl;
};
