// 역할: 티켓팅 회원가입 요청과 응답 변환 로직을 제공합니다.
import { createHttpClient } from "@/api/ticketing/httpClient";
import { env, requireEnv } from "@/utils/common/env";

const getClient = () =>
  createHttpClient({
    baseUrl: requireEnv(
      env.apiBaseUrl || env.ticketingApiBaseUrl,
      "VITE_API_BASE_URL (or VITE_API_URL)",
    ),
  });

interface VerifyStudentResponse {
  signupToken: string;
  student: {
    studentId: string;
    name: string;
    college: string;
    major: string;
    academicStatus: string;
  };
}

export interface PhoneVerificationCreateResponse {
  sessionId: string;
  status: string;
  octomoReceiveNumber: string;
  messageBody: string;
  expiresInSec: number;
  statusPollHintSec: number;
  expiresAt: string;
}

export interface PhoneVerificationStatusResponse {
  sessionId: string;
  status: string;
  attemptCount: number;
  expiresInSec: number;
  expiresAt: string;
  verifiedAt: string | null;
  verifiedPhoneNumberMasked: string | null;
}

export const signupApi = {
  verifyStudent: async (
    dkuStudentId: string,
    dkuPassword: string,
  ): Promise<VerifyStudentResponse> => {
    const client = getClient();
    return client.post<VerifyStudentResponse>("/user/dku/verify", {
      dkuStudentId,
      dkuPassword,
    });
  },

  createPhoneVerificationSession: async (
    signupToken: string,
  ): Promise<PhoneVerificationCreateResponse> => {
    const client = getClient();
    return client.post<PhoneVerificationCreateResponse>(
      `/user/phone-verifications/${signupToken}/sessions`,
    );
  },

  verifyPhoneSession: async (
    sessionId: string,
    phoneNumber: string,
  ): Promise<PhoneVerificationStatusResponse> => {
    const client = getClient();
    return client.post<PhoneVerificationStatusResponse>(
      `/user/phone-verifications/sessions/${sessionId}/verify`,
      { phoneNumber },
    );
  },

  completeSignup: async (
    signupToken: string,
    password: string,
    confirmPassword: string,
    phoneVerificationSessionId: string,
  ): Promise<void> => {
    const client = getClient();
    await client.post(`/user/${signupToken}`, {
      password,
      confirmPassword,
      phoneVerificationSessionId,
    });
  },
};
