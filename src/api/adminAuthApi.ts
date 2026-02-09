import { createHttpClient } from "@/api/httpClient";
import { authStore } from "@/store/authStore";
import type { AdminSystem } from "@/store/adminSystemStore";
import type { AuthCredentials, AuthSession } from "@/types/model/auth.model";
import { env, requireEnv } from "@/utils/env";

type AdminAuthResponse = {
  accessToken?: string;
  token?: string;
  admin?: {
    id?: number;
    name?: string;
    studentId?: string;
    role?: string;
  };
};

const resolveBaseUrl = (system: AdminSystem) => {
  const base =
    system === "board"
      ? env.boardApiBaseUrl || env.apiBaseUrl
      : env.ticketingApiBaseUrl || env.apiBaseUrl;

  return requireEnv(
    base,
    system === "board"
      ? "VITE_BOARD_API_BASE_URL"
      : "VITE_TICKETING_API_BASE_URL",
  );
};

const getAdminAuthClient = (system: AdminSystem) =>
  createHttpClient({
    baseUrl: resolveBaseUrl(system),
    getAccessToken: authStore.getAccessToken,
  });

const mapAdminAuthResponse = (payload: unknown): AuthSession => {
  const body = (payload && typeof payload === "object"
    ? payload
    : {}) as Record<string, any>;
  const data =
    body.data && typeof body.data === "object" ? body.data : body;

  const accessToken =
    typeof data?.accessToken === "string"
      ? data.accessToken
      : typeof data?.token === "string"
        ? data.token
        : "";

  const admin = data?.admin ?? null;

  return {
    tokens: {
      accessToken,
      refreshToken: "",
      expiresIn: null,
    },
    user: admin
      ? {
          id: String(admin.id ?? ""),
          name: admin.name ?? "",
          role: "admin",
          department: "",
          studentId: admin.studentId ?? "",
        }
      : null,
  };
};

export const adminAuthApi = {
  login: async (
    payload: AuthCredentials,
    system: AdminSystem,
  ): Promise<AuthSession> => {
    if (env.apiMode === "mock") {
      return Promise.resolve({
        tokens: {
          accessToken: "mock-admin-token",
          refreshToken: "",
          expiresIn: 3600,
        },
        user: {
          id: "admin",
          name: "관리자",
          role: "admin",
          department: "",
          studentId: payload.studentId,
        },
      });
    }

    const client = getAdminAuthClient(system);
    const dto = await client.post<AdminAuthResponse | { data?: AdminAuthResponse }>(
      "/api/admin/auth/login",
      {
        studentId: payload.studentId,
        password: payload.password,
      },
    );

    return mapAdminAuthResponse(dto);
  },
};
