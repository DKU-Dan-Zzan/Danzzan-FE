export type BackendTarget = "serverdb" | "compose";

const DEFAULT_BACKEND_TARGET: BackendTarget = "serverdb";
const DEFAULT_FALLBACK_BASE_URL = "http://127.0.0.1:8080";

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
  const explicit = normalizeEnvValue(primary) || normalizeEnvValue(legacy);
  if (explicit) {
    return explicit;
  }

  const host =
    normalizeEnvValue(runtimeHost) ||
    (typeof window !== "undefined" ? window.location.hostname : "");

  if (host) {
    const port = backendTarget === "compose" ? 8081 : 8080;
    return `http://${host}:${port}`;
  }

  return fallbackBaseUrl;
};
