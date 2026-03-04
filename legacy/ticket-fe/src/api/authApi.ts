import { createHttpClient } from "@/api/httpClient";
import { mapAuthLoginResponse } from "@/mappers/authMapper";
import { authStore } from "@/store/authStore";
import type { AuthLoginResponseDto } from "@/types/dto/auth.dto";
import type { AuthCredentials, AuthSession } from "@/types/model/auth.model";
import { env, requireEnv } from "@/utils/env";

const getAuthClient = () =>
  createHttpClient({
    baseUrl: requireEnv(
      env.apiBaseUrl || env.ticketingApiBaseUrl,
      "VITE_API_BASE_URL (or VITE_API_URL)",
    ),
    getAccessToken: authStore.getAccessToken,
  });

export const authApi = {
  login: async (payload: AuthCredentials): Promise<AuthSession> => {
    if (env.apiMode === "mock") {
      console.log("Mocking login request with payload:", payload);
      return Promise.resolve({
        tokens: {
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
          expiresIn: 3600,
        },
        user: {
          id: "1",
          name: "단짠",
          role: "student",
          department: "소프트웨어학과",
          studentId: payload.studentId,
        },
      });
    }

    const client = getAuthClient();
    const dto = await client.post<AuthLoginResponseDto>("/user/login", {
      studentId: payload.studentId,
      password: payload.password,
    });
    return mapAuthLoginResponse(dto ?? {});
  },
  refresh: async (): Promise<AuthSession> => {
    const client = getAuthClient();
    const refreshToken = authStore.getRefreshToken();
    if (!refreshToken) {
      throw new Error("Missing refresh token.");
    }
    const dto = await client.post<AuthLoginResponseDto>("/user/reissue", {
      refreshToken,
    });
    return mapAuthLoginResponse(dto ?? {});
  },
};
