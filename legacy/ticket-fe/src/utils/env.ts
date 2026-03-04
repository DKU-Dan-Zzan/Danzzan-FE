export type ApiMode = "live" | "mock";
export type BackendTarget = "serverdb" | "compose";

const resolveApiMode = (value?: string): ApiMode => {
  return value === "mock" ? "mock" : "live";
};

const resolveBackendTarget = (value?: string): BackendTarget => {
  return value === "compose" ? "compose" : "serverdb";
};

const normalizeEnv = (value?: string): string => {
  return value?.trim() ?? "";
};

const resolveDefaultApiBaseUrl = (target: BackendTarget): string => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const port = target === "compose" ? 8081 : 8080;
    return `http://${host}:${port}`;
  }

  return "";
};

const resolveApiBaseUrl = (target: BackendTarget): string => {
  const configured = normalizeEnv(
    import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL,
  );

  if (configured) {
    return configured;
  }

  return resolveDefaultApiBaseUrl(target);
};

const backendTarget = resolveBackendTarget(import.meta.env.VITE_BACKEND_TARGET);
const apiBaseUrl = resolveApiBaseUrl(backendTarget);

export const env = {
  backendTarget,
  apiBaseUrl,
  ticketingApiBaseUrl:
    normalizeEnv(import.meta.env.VITE_TICKETING_API_BASE_URL) || apiBaseUrl,
  apiMode: resolveApiMode(import.meta.env.VITE_API_MODE),
  devAccessToken: import.meta.env.VITE_DEV_ACCESS_TOKEN ?? "",
  isDev: import.meta.env.DEV,
};

export const requireEnv = (value: string, name: string): string => {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};
