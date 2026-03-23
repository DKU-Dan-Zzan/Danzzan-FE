// 역할: 공통 환경변수 값을 안전하게 읽기 위한 접근 유틸을 제공한다.

import {
  normalizeEnvValue,
  resolveApiBaseUrl,
  resolveBackendTarget,
} from "@/lib/env";

export type ApiMode = "live" | "mock";

const resolveApiMode = (value?: string): ApiMode => {
  return value === "mock" ? "mock" : "live";
};

const backendTarget = resolveBackendTarget(import.meta.env.VITE_BACKEND_TARGET);
const apiBaseUrl = resolveApiBaseUrl({
  primary: import.meta.env.VITE_API_BASE_URL,
  legacy: import.meta.env.VITE_API_URL,
  backendTarget,
});

export const env = {
  backendTarget,
  apiBaseUrl,
  ticketingApiBaseUrl:
    normalizeEnvValue(import.meta.env.VITE_TICKETING_API_BASE_URL) || apiBaseUrl,
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
