// 역할: student profile api 관련 HTTP 요청 함수를 제공하는 API 어댑터다.

import { getTicketingApiBaseUrl } from "@/api/common/baseUrl";
import { createHttpClient } from "@/api/common/httpClient";
import { authStore } from "@/store/common/authStore";
import type { AuthUser } from "@/types/common/auth.model";

type StudentProfileDto = {
  id?: string;
  name?: string;
  role?: string;
  department?: string;
  studentId?: string;
  college?: string;
};

const getClient = () =>
  createHttpClient({
    baseUrl: getTicketingApiBaseUrl(),
    getAccessToken: authStore.getAccessToken,
  });

const mapRole = (role?: string): AuthUser["role"] => {
  if (role === "student" || role === "admin") {
    return role;
  }
  return "unknown";
};

const mapUser = (dto: StudentProfileDto | null | undefined): AuthUser | null => {
  if (!dto) {
    return null;
  }

  return {
    id: dto.id ?? "",
    name: dto.name ?? "",
    role: mapRole(dto.role),
    department: dto.department ?? "",
    studentId: dto.studentId ?? "",
    college: dto.college ?? "",
  };
};

export const studentProfileApi = {
  me: async (): Promise<AuthUser | null> => {
    const client = getClient();
    const dto = await client.get<StudentProfileDto>("/user/me");
    return mapUser(dto);
  },
};
