// 역할: useAdminAuth 로그인 에러 메시지와 세션 전환 경계를 검증합니다.
// @vitest-environment jsdom
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/api/common/httpClient";
import { resolveAdminLoginErrorMessage, useAdminAuth } from "@/hooks/app/admin/useAdminAuth";
import { authStore } from "@/store/common/authStore";
import type { AuthSession } from "@/types/common/auth.model";

const adminLogin = vi.hoisted(() => vi.fn());

vi.mock("@/api/app/admin/adminAuthApi", () => ({ authApi: { login: adminLogin }, adminAuthApi: { login: adminLogin } }));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void };
const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
};
const token = (role: string) => `header.${btoa(JSON.stringify({ role, exp: 9999999999 }))}.signature`;
const session = (role: string, studentId: string): AuthSession => ({
  tokens: { accessToken: token(role), refreshToken: "refresh", expiresIn: null },
  user: { id: studentId, role: "admin", name: "관리자", department: "소프트웨어학과", college: "SW융합대학", studentId },
});

let login: ReturnType<typeof useAdminAuth>["login"];
let root: Root;
let container: HTMLDivElement;
const Harness = ({ onReady }: { onReady: (nextLogin: ReturnType<typeof useAdminAuth>["login"]) => void }) => {
  const nextLogin = useAdminAuth().login;
  useEffect(() => {
    onReady(nextLogin);
  }, [nextLogin, onReady]);
  return null;
};

beforeEach(async () => {
  localStorage.clear();
  authStore.clear();
  adminLogin.mockReset();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(<Harness onReady={(nextLogin) => { login = nextLogin; }} />); });
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
  authStore.clear();
});

describe("resolveAdminLoginErrorMessage", () => {
  it("401 에러는 학번/비밀번호 오류 안내 문구로 변환한다", () => {
    const message = resolveAdminLoginErrorMessage(new HttpError("Request failed with status 401", 401));

    expect(message).toBe("학번 또는 비밀번호가 올바르지 않습니다.");
  });

  it("명시적인 에러 메시지는 그대로 노출한다", () => {
    const message = resolveAdminLoginErrorMessage(new Error("로그인에 실패했습니다."));

    expect(message).toBe("로그인에 실패했습니다.");
  });

  it("현재 세션의 관리자 로그인은 cookie 재발급 모드로 저장한다", async () => {
    const next = session("ROLE_ADMIN", "20260001");
    adminLogin.mockResolvedValue(next);

    await expect(login("20260001", "password")).resolves.toBeUndefined();

    expect(authStore.getSnapshot()).toMatchObject({ tokens: next.tokens, refreshMode: "cookie" });
  });

  it.each(["logout", "account-switch"] as const)("늦은 관리자 로그인 응답은 %s 뒤에 세션을 바꾸지 않는다", async (boundary) => {
    const late = deferred<AuthSession>();
    adminLogin.mockReturnValue(late.promise);
    const pending = login("20260002", "password");

    if (boundary === "logout") authStore.clear();
    else authStore.setSession(session("ROLE_USER", "20260003"));

    late.resolve(session("ROLE_ADMIN", "20260002"));

    await expect(pending).rejects.toMatchObject({ code: "AUTH_SESSION_EXPIRED" });
    expect(authStore.getSnapshot().user?.studentId).not.toBe("20260002");
  });
});
