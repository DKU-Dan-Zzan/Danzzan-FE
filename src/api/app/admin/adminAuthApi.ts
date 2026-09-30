// 역할: admin auth api 관련 HTTP 요청 함수를 제공하는 API 어댑터다.

import { getApiBaseUrl } from "@/api/common/baseUrl";
import { createHttpClient } from "@/api/common/httpClient";
import { canAccessAdminConsole, resolvePermissionsFromAccessToken, resolveRoleFromAccessToken } from "@/api/common/authCore";
import { authStore } from "@/store/common/authStore";
import type { AuthCredentials, AuthSession } from "@/types/common/auth.model";
import { env } from "@/utils/common/env";

const getClient = () =>
  createHttpClient({
    baseUrl: getApiBaseUrl(),
    getAccessToken: authStore.getAccessToken,
  });

const decodeTokenPayload = (
  accessToken: string,
  fallbackStudentId: string,
): AuthSession["user"] => {
  if (!accessToken) {
    return null;
  }

  try {
    const payloadPart = accessToken.split(".")[1];
    const decoded = JSON.parse(atob(payloadPart)) as Record<string, unknown>;
    return {
      id: typeof decoded.sub === "string" ? decoded.sub : "",
      name: "",
      role: resolveRoleFromAccessToken(accessToken) ?? "unknown",
      department: "",
      studentId:
        typeof decoded.studentId === "string"
          ? decoded.studentId
          : fallbackStudentId,
      college: typeof decoded.college === "string" ? decoded.college : "",
    };
  } catch {
    return {
      id: "",
      name: "",
      role: resolveRoleFromAccessToken(accessToken) ?? "unknown",
      department: "",
      studentId: fallbackStudentId,
      college: "",
    };
  }
};

export const adminAuthApi = {
  login: async (payload: AuthCredentials): Promise<AuthSession> => {
    if (env.apiMode === "mock") {
      return Promise.resolve({
        tokens: {
          accessToken: `mock.${btoa(JSON.stringify({ sub: "admin", role: "ROLE_ADMIN", exp: Math.floor(Date.now() / 1000) + 3600 }))}.mock`,
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
    const dto = await client.post<{ accessToken: string; refreshToken?: string }>(
      "/auth/login",
      {
        studentNumber: payload.studentId,
        password: payload.password,
      },
    );

    const accessToken = dto?.accessToken ?? "";
    const refreshToken = dto?.refreshToken ?? "";
    const role = resolveRoleFromAccessToken(accessToken);
    if (!canAccessAdminConsole(role, resolvePermissionsFromAccessToken(accessToken))) {
      throw new Error("사용 가능한 관리자 권한이 없는 계정입니다.");
    }

    return {
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: null,
      },
      user: decodeTokenPayload(accessToken, payload.studentId),
    };
  },
};
