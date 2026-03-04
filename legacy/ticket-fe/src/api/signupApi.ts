import { createHttpClient } from "@/api/httpClient";
import { env, requireEnv } from "@/utils/env";

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

  completeSignup: async (
    signupToken: string,
    password: string,
  ): Promise<void> => {
    const client = getClient();
    await client.post(`/user/${signupToken}`, { password });
  },
};
