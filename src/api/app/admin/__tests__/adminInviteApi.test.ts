import { afterEach, describe, expect, it, vi } from "vitest";
import { adminInviteApi } from "@/api/app/admin/adminInviteApi";
import { parseFetchResponse } from "@/api/common/fetchAuth";
import { normalizeAppError } from "@/lib/error/appError";

const fixture = { id: 5, studentId: "001234", name: "홍길동", college: "공과대학", major: "컴퓨터공학", role: "USER", permissions: [] };
const state = vi.hoisted(() => ({ base: "http://localhost:8080" }));
vi.mock("@/api/common/baseUrl", () => ({ getApiBaseUrl: () => state.base }));
vi.mock("@/store/common/authStore", () => ({ authStore: { getAccessToken: () => "token", refreshAccessToken: vi.fn(), clear: vi.fn(), getSessionEpoch: () => 1 } }));
afterEach(() => vi.unstubAllGlobals());

describe("staff API contract", () => {
  it.each(["http://localhost:8080", "/api"])("preserves prefix for base %s", async (base) => {
    state.base = base;
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: fixture })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: fixture })));
    vi.stubGlobal("fetch", fetch);
    expect(await adminInviteApi.candidate(" 001234 ")).toEqual(fixture);
    expect(fetch.mock.calls[0][0]).toBe(`${base}/api/admin/staff/candidates?studentId=001234`);
  });
  it.each(["<html>proxy</html>", { success: true, data: {} }, { success: false, data: fixture }, { success: true, data: { ...fixture, role: "OTHER" } }])("rejects invalid member payload %j", async (payload) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(payload))));
    await expect(adminInviteApi.candidate("001234")).rejects.toThrow();
  });
  it("sends exact permission filter with pagination", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { items: [], page: 2, size: 20, totalElements: 0, totalPages: 0, managementEnabled: true } })));
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    await adminInviteApi.list(2, 20, signal, "TICKETING");
    expect(fetch.mock.calls[0][0]).toContain("/api/admin/staff?page=2&size=20&filter=TICKETING");
    expect(fetch.mock.calls[0][1].signal).toBe(signal);
  });
  it("uses dedicated promotion and demotion routes", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: fixture })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: fixture })));
    vi.stubGlobal("fetch", fetch);
    await adminInviteApi.promoteAdmin(12);
    await adminInviteApi.demoteAdmin(13);
    expect(fetch.mock.calls[0][0]).toBe(`${state.base}/api/admin/staff/12/promote-admin`);
    expect(fetch.mock.calls[0][1]).toMatchObject({ method: "POST" });
    expect(fetch.mock.calls[1][0]).toBe(`${state.base}/api/admin/staff/13/demote-admin`);
    expect(fetch.mock.calls[1][1]).toMatchObject({ method: "POST" });
  });
  it("rejects malformed page and validates flag", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0, managementEnabled: "false" } }))));
    await expect(adminInviteApi.list()).rejects.toThrow();
  });
  it("preserves nested business status/code/message", async () => {
    const body = { success: false, data: null, error: { error: "STAFF_ROLE_CONFLICT", message: "이미 매니저인 회원입니다." } };
    const error = await parseFetchResponse(new Response(JSON.stringify(body), { status: 409 })).catch(e => e);
    expect(normalizeAppError(error)).toMatchObject({ status: 409, code: "STAFF_ROLE_CONFLICT", message: body.error.message });
  });
  it.each([401,403])("keeps status-only auth failures %s", async (status) => {
    const error = await parseFetchResponse(new Response("", { status })).catch(e => e);
    expect(normalizeAppError(error).status).toBe(status);
  });
  it("preserves legacy raw successes and flat failures", async () => {
    expect(await parseFetchResponse(new Response('{"name":"raw"}'))).toEqual({ name: "raw" });
    const error = await parseFetchResponse(new Response('{"message":"flat"}', { status: 400 })).catch(e => e);
    expect(normalizeAppError(error).message).toBe("flat");
  });
});
