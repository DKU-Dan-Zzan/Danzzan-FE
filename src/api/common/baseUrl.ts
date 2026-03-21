import { resolveApiBaseUrl, resolveBackendTarget } from "@/lib/env";

const backendTarget = resolveBackendTarget(import.meta.env.VITE_BACKEND_TARGET);
const resolvedApiBaseUrl = resolveApiBaseUrl({
  primary: import.meta.env.VITE_API_BASE_URL,
  legacy: import.meta.env.VITE_API_URL,
  backendTarget,
});
const resolvedTicketingApiBaseUrl =
  import.meta.env.VITE_TICKETING_API_BASE_URL?.trim() || resolvedApiBaseUrl;

export const getApiBaseUrl = (): string => {
  return resolvedApiBaseUrl;
};

export const getTicketingApiBaseUrl = (): string => {
  return resolvedTicketingApiBaseUrl;
};
