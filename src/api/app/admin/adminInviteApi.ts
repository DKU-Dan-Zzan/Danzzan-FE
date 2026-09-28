// 매니저 API의 envelope를 검증하고 화면에 필요한 data만 반환한다.
import { getApiBaseUrl } from "@/api/common/baseUrl";
import { createFetchWithAuth } from "@/api/common/fetchAuth";
import { authStore } from "@/store/common/authStore";

export type StaffFilter = "ALL" | "ADMIN" | "TICKETING" | "OPERATIONS" | "BOTH";
export type StaffRole = "USER" | "MANAGER" | "ADMIN";
export type StaffPermission = "OPERATIONS" | "TICKETING";
export type StaffMember = { id: number; studentId: string; name: string; college: string; major: string; role: StaffRole; permissions: StaffPermission[] };
export type StaffPage = { items: StaffMember[]; page: number; size: number; totalElements: number; totalPages: number; managementEnabled: boolean };

const request = createFetchWithAuth({
  getBaseUrl: getApiBaseUrl,
  getAccessToken: authStore.getAccessToken,
  reissueAccessToken: authStore.refreshAccessToken,
  clearSession: authStore.clear,
  getSessionEpoch: authStore.getSessionEpoch,
  refreshKey: "staff-auth",
  credentials: "include",
});

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const integer = (value: unknown, min: number): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= min;
const isMember = (value: unknown): value is StaffMember => record(value)
  && integer(value.id, 1)
  && [value.studentId, value.name, value.college, value.major].every(item => typeof item === "string")
  && ["USER", "MANAGER", "ADMIN"].includes(String(value.role))
  && Array.isArray(value.permissions) && value.permissions.every(permission => permission === "OPERATIONS" || permission === "TICKETING");
const isPage = (value: unknown): value is StaffPage => record(value)
  && Array.isArray(value.items) && value.items.every(isMember)
  && integer(value.page, 0) && integer(value.size, 1) && value.size <= 100
  && integer(value.totalElements, 0) && integer(value.totalPages, 0)
  && typeof value.managementEnabled === "boolean";

function unwrap<T>(response: unknown, valid: (value: unknown) => value is T): T {
  if (!record(response) || response.success !== true || !valid(response.data)) {
    throw new Error("서버의 매니저 응답 형식이 올바르지 않습니다. 새로고침 후 다시 확인해 주세요.");
  }
  return response.data;
}

export const adminInviteApi = {
  async candidate(studentId: string, signal?: AbortSignal): Promise<StaffMember> {
    const query = new URLSearchParams({ studentId: studentId.trim() });
    return unwrap(await request(`/api/admin/staff/candidates?${query}`, { signal }), isMember);
  },
  async list(page = 0, size = 20, signal?: AbortSignal, filter: StaffFilter = "ALL"): Promise<StaffPage> {
    const query = new URLSearchParams({ page: String(page), size: String(size), filter });
    return unwrap(await request(`/api/admin/staff?${query}`, { signal }), isPage);
  },
  async updateRole(id: number, role: "USER" | "MANAGER", permissions: StaffPermission[] = []): Promise<StaffMember> {
    return unwrap(await request(`/api/admin/staff/${id}/role`, { method: "PATCH", body: JSON.stringify({ role, permissions }) }), isMember);
  },
  async promoteAdmin(id: number): Promise<StaffMember> {
    return unwrap(await request(`/api/admin/staff/${id}/promote-admin`, { method: "POST" }), isMember);
  },
  async demoteAdmin(id: number): Promise<StaffMember> {
    return unwrap(await request(`/api/admin/staff/${id}/demote-admin`, { method: "POST" }), isMember);
  },
};
