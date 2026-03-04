import { createHttpClient } from "@/ticketing/api/httpClient";
import { mapAuthLoginResponse } from "@/ticketing/mappers/authMapper";
import { authStore } from "@/ticketing/store/authStore";
import type { AuthLoginResponseDto } from "@/ticketing/types/dto/auth.dto";
import type { AuthCredentials, AuthSession } from "@/ticketing/types/model/auth.model";
import { env, requireEnv } from "@/ticketing/utils/env";

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
          name: "Mock User",
          role: "student",
          department: "Computer Science",
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
