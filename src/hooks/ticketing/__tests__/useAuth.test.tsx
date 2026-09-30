// 역할: 티켓팅 로그인 중 세션 전환 시 늦게 도착한 응답을 저장하지 않는지 검증합니다.
// @vitest-environment jsdom
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/hooks/ticketing/useAuth";
import { authStore } from "@/store/common/authStore";
import type { AuthSession } from "@/types/ticketing/model/auth.model";

const userLogin = vi.hoisted(() => vi.fn());
const adminLogin = vi.hoisted(() => vi.fn());

vi.mock("@/api/ticketing/authApi", () => ({ authApi: { login: userLogin } }));
vi.mock("@/api/ticketing/adminAuthApi", () => ({ adminAuthApi: { login: adminLogin } }));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
};

const token = (role: string, permissions?: string[]) => `header.${btoa(JSON.stringify({ role, permissions, exp: 9999999999 }))}.signature`;
const session = (role: string, studentId = "20260001", permissions?: string[]): AuthSession => ({
  tokens: { accessToken: token(role, permissions), refreshToken: "refresh", expiresIn: null },
  user: { id: studentId, name: "회원", role: "student", department: "소프트웨어학과", college: "SW융합대학", studentId },
});

let login: ReturnType<typeof useAuth>["login"];
let root: Root;
let container: HTMLDivElement;

const Harness = ({ onReady }: { onReady: (nextLogin: ReturnType<typeof useAuth>["login"]) => void }) => {
  const nextLogin = useAuth().login;
  useEffect(() => {
    onReady(nextLogin);
  }, [nextLogin, onReady]);
  return null;
};

const render = async () => {
  await act(async () => { root.render(<Harness onReady={(nextLogin) => { login = nextLogin; }} />); });
};

beforeEach(async () => {
  localStorage.clear();
  authStore.clear();
  userLogin.mockReset();
  adminLogin.mockReset();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await render();
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
  authStore.clear();
});

describe("useAuth login session boundary", () => {
  it("일반 회원 로그인은 현재 세션이면 저장하고 반환한다", async () => {
    const next = session("ROLE_USER");
    userLogin.mockResolvedValue(next);

    await expect(login({ studentId: "20260001", password: "password" }, "student")).resolves.toEqual(next);

    expect(authStore.getSnapshot().tokens?.accessToken).toBe(next.tokens.accessToken);
  });

  it("티켓팅 권한이 없는 관리자 로그인은 세션을 저장하지 않는다", async () => {
    const denied = session("ROLE_MANAGER", "20260002", ["OPERATIONS"]);
    adminLogin.mockResolvedValue(denied);

    await expect(login({ studentId: "20260002", password: "password" }, "admin"))
      .rejects.toThrow("티켓팅 관리 권한이 없는 계정입니다.");

    expect(authStore.getSnapshot().tokens).toBeNull();
  });

  it.each([
    ["일반 회원", "student", "logout"],
    ["티켓 관리자", "admin", "account-switch"],
  ] as const)("%s 로그인 응답은 %s 뒤에 도착하면 폐기한다", async (_label, role, boundary) => {
    const late = deferred<AuthSession>();
    if (role === "admin") adminLogin.mockReturnValue(late.promise);
    else userLogin.mockReturnValue(late.promise);

    const pending = login({ studentId: "20260003", password: "password" }, role);

    if (boundary === "logout") authStore.clear();
    else authStore.setSession(session("ROLE_USER", "20260004"));

    late.resolve(session(role === "admin" ? "ROLE_ADMIN" : "ROLE_USER", "20260003", ["TICKETING"]));

    await expect(pending).rejects.toMatchObject({ code: "AUTH_SESSION_EXPIRED" });
    expect(authStore.getSnapshot().user?.studentId).toBe(boundary === "logout" ? undefined : "20260004");
    expect(authStore.getSnapshot().user?.studentId).not.toBe("20260003");
  });
});
