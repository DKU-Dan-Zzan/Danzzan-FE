import { getTicketingApiBaseUrl } from "@/api/common/baseUrl";
import { createHttpClient } from "@/api/common/httpClient";
import { hasRequiredRole, resolveRoleFromAccessToken } from "@/api/common/authCore";
import { authStore } from "@/store/common/authStore";
import type { AuthCredentials, AuthSession } from "@/types/common/auth.model";
import { env } from "@/utils/common/env";

const getClient = () =>
  createHttpClient({
    baseUrl: getTicketingApiBaseUrl(),
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
      role: "admin",
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
      role: "admin",
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

    const accessToken = dto?.accessToken ?? "";
    const refreshToken = dto?.refreshToken ?? "";
    const role = resolveRoleFromAccessToken(accessToken);
    if (!hasRequiredRole("admin", role)) {
      throw new Error("관리자 권한이 없는 계정입니다.");
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
