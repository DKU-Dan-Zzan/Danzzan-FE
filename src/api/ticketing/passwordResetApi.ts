// 역할: 티켓팅 비밀번호 재설정 플로우의 검증/변경 API를 제공합니다.
import { createHttpClient } from "@/api/ticketing/httpClient";
import { env, requireEnv } from "@/utils/common/env";

type RequestResetCodeResponse = {
  requestId?: string;
  expiresInSec?: number;
};

type VerifyResetCodeResponse = {
  verificationToken?: string;
};

const getClient = () =>
  createHttpClient({
    baseUrl: requireEnv(
      env.apiBaseUrl || env.ticketingApiBaseUrl,
      "VITE_API_BASE_URL (or VITE_API_URL)",
    ),
  });

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const passwordResetApi = {
  requestCode: async (studentId: string): Promise<RequestResetCodeResponse> => {
    if (env.apiMode === "mock") {
      await wait(400);
      return {
        requestId: `mock-reset-${Date.now()}`,
        expiresInSec: 180,
      };
    }

    const client = getClient();
    return client.post<RequestResetCodeResponse>("/user/password/reset/request", {
      studentId,
      email: `${studentId}@dankook.ac.kr`,
    });
  },

  verifyCode: async (payload: {
    studentId: string;
    code: string;
    requestId?: string;
  }): Promise<VerifyResetCodeResponse> => {
    if (env.apiMode === "mock") {
      await wait(300);
      return {
        verificationToken: `mock-verified-${Date.now()}`,
      };
    }

    const client = getClient();
    return client.post<VerifyResetCodeResponse>("/user/password/reset/verify", payload);
  },

  resetPassword: async (payload: {
    requestId?: string;
    verificationToken?: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> => {
    if (env.apiMode === "mock") {
      await wait(500);
      return;
    }

    const client = getClient();
    await client.post("/user/password/reset", payload);
  },
};
