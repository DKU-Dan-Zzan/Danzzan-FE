import { createHttpClient } from "@/ticketing/api/httpClient";
import { authStore } from "@/ticketing/store/authStore";
import type { AuthCredentials, AuthSession } from "@/ticketing/types/model/auth.model";
import { env, requireEnv } from "@/ticketing/utils/env";

/**
 * 관리자 로그인 API
 * 백엔드는 학생/관리자 구분 없이 POST /user/login 을 사용하며,
 * JWT 토큰의 role 클레임으로 ROLE_ADMIN / ROLE_USER를 구분합니다.
 */

const getClient = () =>
  createHttpClient({
    baseUrl: requireEnv(
      env.apiBaseUrl || env.ticketingApiBaseUrl,
      "VITE_API_BASE_URL (or VITE_API_URL)",
    ),
    getAccessToken: authStore.getAccessToken,
  });

export const adminAuthApi = {
  login: async (payload: AuthCredentials): Promise<AuthSession> => {
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

    const client = getClient();
    const dto = await client.post<{ accessToken: string; refreshToken: string }>(
      "/user/login",
      {
        studentId: payload.studentId,
        password: payload.password,
      },
    );

    // JWT에서 role 정보를 디코딩하여 ADMIN인지 확인
    const accessToken = dto?.accessToken ?? "";
    const refreshToken = dto?.refreshToken ?? "";

    let user = null;
    if (accessToken) {
      try {
        const payloadPart = accessToken.split(".")[1];
        const decoded = JSON.parse(atob(payloadPart));
        user = {
          id: decoded.sub ?? "",
          name: "",
          role: decoded.role === "ROLE_ADMIN" ? "admin" as const : "unknown" as const,
          department: "",
          studentId: decoded.studentId ?? "",
        };

        if (decoded.role !== "ROLE_ADMIN") {
          throw new Error("관리자 권한이 없는 계정입니다.");
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes("관리자 권한")) {
          throw e;
        }
      }
    }

    return {
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: null,
      },
      user,
    };
  },
};
