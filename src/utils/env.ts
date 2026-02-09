export type ApiMode = "live" | "mock";

const resolveApiMode = (value?: string): ApiMode => {
  return value === "mock" ? "mock" : "live";
};

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_URL ?? "",
  ticketingApiBaseUrl: import.meta.env.VITE_TICKETING_API_BASE_URL ?? "",
  boardApiBaseUrl: import.meta.env.VITE_BOARD_API_BASE_URL ?? "",
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
