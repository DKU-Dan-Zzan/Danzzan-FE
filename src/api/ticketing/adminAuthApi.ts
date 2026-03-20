import { createHttpClient } from "@/api/ticketing/httpClient";
import { hasRequiredRole, resolveRoleFromAccessToken } from "@/api/common/authCore";
import { authStore } from "@/store/ticketing/authStore";
import type { AuthCredentials, AuthSession } from "@/types/ticketing/model/auth.model";
import { env, requireEnv } from "@/utils/ticketing/env";

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
          college: "",
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

    // JWT role 클레임으로 관리자 권한 판별
    const accessToken = dto?.accessToken ?? "";
    const refreshToken = dto?.refreshToken ?? "";
    const role = resolveRoleFromAccessToken(accessToken);
    if (!hasRequiredRole("admin", role)) {
      throw new Error("관리자 권한이 없는 계정입니다.");
    }

    let user: AuthSession["user"] = null;
    if (accessToken) {
      try {
        const payloadPart = accessToken.split(".")[1];
        const decoded = JSON.parse(atob(payloadPart));
        user = {
          id: decoded.sub ?? "",
          name: "",
          role: "admin" as const,
          department: "",
          studentId: decoded.studentId ?? "",
          college: decoded.college ?? "",
        };
      } catch {
        user = {
          id: "",
          name: "",
          role: "admin",
          department: "",
          studentId: payload.studentId,
          college: "",
        };
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
