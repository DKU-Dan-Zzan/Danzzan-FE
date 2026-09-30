import { beforeEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@/api/common/httpClient", () => ({ createHttpClient: () => client }));
vi.mock("@/api/common/baseUrl", () => ({ getApiBaseUrl: () => "/api" }));
vi.mock("@/store/common/authStore", () => ({ authStore: { getAccessToken: () => null } }));
vi.mock("@/utils/common/env", () => ({ env: { apiMode: "real" } }));

import { adminAuthApi } from "@/api/app/admin/adminAuthApi";

const token = (payload: Record<string, unknown>) => `x.${btoa(JSON.stringify(payload))}.x`;
describe("adminAuthApi capability boundary", () => {
  beforeEach(() => vi.clearAllMocks());
  it.each([
    { role: "ROLE_MANAGER" },
    { role: "ROLE_MANAGER", permissions: ["UNKNOWN"] },
  ])("rejects manager with no usable scope", async (payload) => {
    client.post.mockResolvedValue({ accessToken: token(payload) });
    await expect(adminAuthApi.login({ studentId: "123", password: "pw" })).rejects.toThrow("사용 가능한 관리자 권한");
  });
  it("accepts a manager with one explicit scope", async () => {
    client.post.mockResolvedValue({ accessToken: token({ role: "ROLE_MANAGER", permissions: ["OPERATIONS"] }) });
    await expect(adminAuthApi.login({ studentId: "123", password: "pw" })).resolves.toMatchObject({ user: { role: "manager" } });
  });
});
