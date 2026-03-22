// 역할: 티켓팅 도메인 API 호출/계약/클라이언트 로직을 제공하는 모듈입니다.
import { createHttpClient } from "@/api/ticketing/httpClient";
import { mapAuthLoginResponse, mapAuthUserDto } from "@/lib/ticketing/mappers/authMapper";
import { authStore } from "@/store/ticketing/authStore";
import type { AuthLoginResponseDto, AuthUserDto } from "@/types/ticketing/dto/auth.dto";
import type { AuthCredentials, AuthSession } from "@/types/ticketing/model/auth.model";
import { env, requireEnv } from "@/utils/ticketing/env";

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
          college: "",
        },
      });
    }

    const client = getAuthClient();
    const dto = await client.post<AuthLoginResponseDto>("/user/login", {
      studentId: payload.studentId,
      password: payload.password,
    });

    const session = mapAuthLoginResponse(dto ?? {});
    const hasProfileGap = !session.user?.name?.trim() || !session.user?.college?.trim();
    if (!session.tokens.accessToken || !hasProfileGap) {
      return session;
    }

    try {
      const meDto = await client.get<AuthUserDto>("/user/me", {
        headers: {
          Authorization: `Bearer ${session.tokens.accessToken}`,
        },
      });
      const resolvedUser = mapAuthUserDto(meDto ?? undefined);
      return {
        ...session,
        user: resolvedUser ?? session.user,
      };
    } catch {
      return session;
    }
  },
  me: async () => {
    const client = getAuthClient();
    const dto = await client.get<AuthUserDto>("/user/me");
    return mapAuthUserDto(dto ?? undefined);
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
