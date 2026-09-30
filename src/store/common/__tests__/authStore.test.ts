// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
const refresh = vi.hoisted(() => vi.fn());
vi.mock("@/api/common/authRefresh", () => ({ refreshAccessTokenWithCookie: refresh, refreshAccessTokenWithToken: refresh }));
vi.mock("@/utils/common/env", () => ({ env: { isDev: false } }));
const token = (role: string, sub = "1") => `header.${btoa(JSON.stringify({ role, sub, exp: 9999999999 }))}.signature`;
const session = (role: string) => ({ tokens: { accessToken: token(role), refreshToken: "refresh", expiresIn: null }, user: { id: "1", role: "admin" as const, name: "회원", department: "", college: "", studentId: "001" } });
beforeEach(() => { vi.resetModules(); refresh.mockReset(); localStorage.clear(); });
describe("authStore session boundaries", () => {
  it("migrates legacy stored admin and nested user roles using manager JWT", async () => {
    localStorage.setItem("danzzan.auth", JSON.stringify({ ...session("ROLE_MANAGER"), role: "admin" }));
    const { authStore } = await import("@/store/common/authStore");
    expect(authStore.getSnapshot()).toMatchObject({ role: "manager", user: { role: "manager" } });
    expect(JSON.parse(localStorage.getItem("danzzan.auth")!)).toMatchObject({ schemaVersion: 2, role: "manager" });
  });
  it("clears unknown claims and legacy token keys", async () => {
    localStorage.setItem("danzzan.auth", JSON.stringify(session("OTHER"))); localStorage.setItem("accessToken", "invalid");
    const { authStore } = await import("@/store/common/authStore");
    expect(authStore.getAccessToken()).toBeNull(); expect(localStorage.getItem("danzzan.auth")).toBeNull(); expect(localStorage.getItem("accessToken")).toBeNull();
  });
  it("publishes incremented epoch to subscribers and replaces role on refresh", async () => {
    const { authStore } = await import("@/store/common/authStore");
    const seen: number[] = []; const unsub = authStore.subscribe(() => seen.push(authStore.getSessionEpoch()));
    authStore.setSession(session("ROLE_USER")); expect(seen).toEqual([1]);
    refresh.mockResolvedValue({ accessToken: token("ROLE_MANAGER") });
    await authStore.refreshAccessToken(); expect(authStore.getRole()).toBe("manager"); expect(authStore.getSnapshot().user?.role).toBe("manager"); expect(authStore.getSessionEpoch()).toBe(1); unsub();
  });
  it.each([true, false])("ignores old refresh completion after account switch (success=%s)", async (success) => {
    const { authStore } = await import("@/store/common/authStore"); authStore.setSession(session("ROLE_USER"));
    let resolve!: (value: { accessToken: string }) => void; let reject!: (value: Error) => void;
    refresh.mockImplementation(() => new Promise((yes,no) => { resolve=yes; reject=no; }));
    const pending = authStore.refreshAccessToken(); authStore.setSession(session("ROLE_ADMIN"));
    if (success) resolve({ accessToken: token("ROLE_USER") }); else reject(new Error("expired"));
    expect(await pending).toBeNull(); expect(authStore.getRole()).toBe("admin");
  });
  it("scopes direct refresh singleflight to the current epoch", async () => {
    const { authStore } = await import("@/store/common/authStore"); authStore.setSession(session("ROLE_USER"));
    refresh.mockResolvedValue({ accessToken: token("ROLE_USER") });
    await Promise.all([authStore.refreshAccessToken(),authStore.refreshAccessToken()]); expect(refresh).toHaveBeenCalledTimes(1);
  });
  it.each([undefined, null])("preserves omitted refresh fields across successive token refreshes (%s)", async missing => {
    const { authStore } = await import("@/store/common/authStore");
    const initial = session("ROLE_USER");
    authStore.setSession({ ...initial, tokens: { ...initial.tokens, expiresIn: 3600 } });
    refresh.mockResolvedValue({ accessToken: token("ROLE_USER"), refreshToken: missing, expiresIn: missing });
    await authStore.refreshAccessToken();
    expect(authStore.getSnapshot().tokens).toMatchObject({ refreshToken: "refresh", expiresIn: 3600 });
    expect(JSON.parse(localStorage.getItem("danzzan.auth")!).tokens).toMatchObject({ refreshToken: "refresh", expiresIn: 3600 });
    await authStore.refreshAccessToken();
    expect(refresh).toHaveBeenLastCalledWith("refresh", token("ROLE_USER"));
  });
  it("replaces refresh fields when the server provides rotated values", async () => {
    const { authStore } = await import("@/store/common/authStore");
    authStore.setSession(session("ROLE_USER"));
    refresh.mockResolvedValue({ accessToken: token("ROLE_USER"), refreshToken: "rotated", expiresIn: 0 });
    await authStore.refreshAccessToken();
    expect(authStore.getSnapshot().tokens).toMatchObject({ refreshToken: "rotated", expiresIn: 0 });
  });
  it("invalidates epoch on a cross-tab storage change", async () => {
    const { authStore } = await import("@/store/common/authStore"); authStore.setSession(session("ROLE_USER")); const unsub=authStore.subscribe(() => {});
    localStorage.setItem("danzzan.auth", JSON.stringify(session("ROLE_MANAGER"))); window.dispatchEvent(new StorageEvent("storage", { key: "danzzan.auth" }));
    expect(authStore.getSessionEpoch()).toBe(2); expect(authStore.getRole()).toBe("manager"); unsub();
  });
  it("purges corrupt cross-tab storage and prevents stale profile writes", async () => {
    const { authStore } = await import("@/store/common/authStore"); authStore.setSession(session("ROLE_USER"));
    const oldEpoch = authStore.getSessionEpoch(); const unsub = authStore.subscribe(() => {});
    localStorage.setItem("danzzan.auth", "bad-json"); window.dispatchEvent(new StorageEvent("storage", { key: "danzzan.auth" }));
    expect(localStorage.getItem("danzzan.auth")).toBeNull(); expect(authStore.getAccessToken()).toBeNull();
    authStore.setSession(session("ROLE_MANAGER"));
    expect(authStore.updateUser(session("ROLE_USER").user, oldEpoch)).toBe(false);
    expect(authStore.getRole()).toBe("manager"); unsub();
  });

});
