// 역할: authCore 모듈의 API 계약과 예외 처리를 검증하는 테스트다.

import {
  resolveRoleFromAccessToken,
  resolvePermissionsFromAccessToken,
  withAuthRetry,
} from "@/api/common/authCore";
import { requireAdminRole } from "@/lib/app/admin/admin-auth-session";

const readStatus = (error: unknown): number | null => {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }
  return null;
};

const createJwtLikeToken = (payload: Record<string, unknown>): string => {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `header.${encoded}.signature`;
};

describe("authCore", () => {
  it("role 클레임에서 admin 역할을 판별한다", () => {
    const token = createJwtLikeToken({ role: "ROLE_ADMIN" });
    expect(resolveRoleFromAccessToken(token)).toBe("admin");
  });
  it("manager는 JWT의 알려진 permissions만 가지며 누락 시 관리자 범위가 없다", () => {
    expect(resolvePermissionsFromAccessToken(createJwtLikeToken({ role: "ROLE_MANAGER", permissions: ["TICKETING", "OTHER"] }))).toEqual(["TICKETING"]);
    expect(resolvePermissionsFromAccessToken(createJwtLikeToken({ role: "ROLE_MANAGER" }))).toEqual([]);
    expect(resolvePermissionsFromAccessToken(createJwtLikeToken({ role: "ROLE_ADMIN" }))).toEqual(["OPERATIONS", "TICKETING"]);
  });
  it("운영 범위가 없는 manager 토큰은 관리자 세션으로 복원하지 않는다", () => {
    expect(() => requireAdminRole(createJwtLikeToken({ role: "ROLE_MANAGER" }))).toThrow("사용 가능한 관리자 권한");
  });

  it("403 응답에서는 재발급 없이 AUTH_FORBIDDEN 에러를 던진다", async () => {
    const refreshMock = vi.fn(async () => "new-token");

    await expect(
      withAuthRetry({
        getAccessToken: () => "old-token",
        refreshAccessToken: refreshMock,
        readStatus,
        execute: async () => {
          throw { status: 403 };
        },
      }),
    ).rejects.toMatchObject({
      code: "AUTH_FORBIDDEN",
      status: 403,
    });

    expect(refreshMock).toHaveBeenCalledTimes(0);
  });

  it("401 다발 요청에서도 refresh single-flight가 1회만 수행된다", async () => {
    const refreshMock = vi.fn(async () => "new-token");
    const executeMock = vi.fn(async (_token: string | null, context: { isRetry: boolean }) => {
      if (!context.isRetry) {
        throw { status: 401 };
      }
      return "ok";
    });

    const run = () =>
      withAuthRetry({
        getAccessToken: () => "expired-token",
        refreshAccessToken: refreshMock,
        refreshKey: "auth-core-test",
        readStatus,
        execute: executeMock,
      });

    await Promise.all([run(), run(), run()]);

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(executeMock).toHaveBeenCalledTimes(6);
  });

  it("refresh 결과가 없으면 AUTH_SESSION_EXPIRED 에러를 던진다", async () => {
    await expect(
      withAuthRetry({
        getAccessToken: () => "expired-token",
        refreshAccessToken: async () => null,
        readStatus,
        execute: async (_token, context) => {
          if (!context.isRetry) {
            throw { status: 401 };
          }
          return "ok";
        },
      }),
    ).rejects.toMatchObject({
      code: "AUTH_SESSION_EXPIRED",
      status: 401,
    });
  });

  it("요청 중 세션이 바뀌면 이전 401 요청을 재시도하지 않는다", async () => {
    let epoch = 1;
    const refresh = vi.fn(async () => "old-refresh");
    const run = withAuthRetry({ getAccessToken: () => "old", getSessionEpoch: () => epoch, refreshAccessToken: refresh, readStatus, execute: async () => { throw { status: 401 }; } });
    epoch = 2;
    await expect(run).rejects.toMatchObject({ status: 401 });
    expect(refresh).not.toHaveBeenCalled();
  });

  it("refresh 성공 전에 세션이 변경되면 retry하지 않는다", async () => {
    let epoch = 1; let resolve!: (v: string) => void;
    const refresh = vi.fn(() => new Promise<string>(r => { resolve = r; }));
    const run = withAuthRetry({ getAccessToken: () => "old", getSessionEpoch: () => epoch, refreshAccessToken: refresh, readStatus, execute: async (_t, c) => { if (!c.isRetry) throw { status: 401 }; return "ok"; } });
    await Promise.resolve(); epoch = 2; resolve("new");
    await expect(run).rejects.toMatchObject({ status: 401 });
  });

  it("refresh 실패가 새 세션을 clear하지 않는다", async () => {
    let epoch = 1; let reject!: (e: Error) => void;
    const clear = vi.fn(); const refresh = vi.fn(() => new Promise<string>((_, r) => { reject = r; }));
    const run = withAuthRetry({ getAccessToken: () => "old", getSessionEpoch: () => epoch, refreshAccessToken: refresh, onSessionExpired: clear, readStatus, execute: async () => { throw { status: 401 }; } });
    await Promise.resolve(); epoch = 2; reject(new Error("stale"));
    await expect(run).rejects.toMatchObject({ status: 401 }); expect(clear).not.toHaveBeenCalled();
  });

  it.each([
    [false, null], [false, 401], [false, 403],
    [true, null], [true, 401], [true, 403],
  ])("세션 변경 후 응답을 폐기하고 콜백을 호출하지 않는다 (retry=%s, status=%s)", async (retry, status) => {
    let epoch = 1;
    let resolve!: (value: string) => void;
    let reject!: (error: { status: number }) => void;
    let started!: () => void;
    const ready = new Promise<void>(done => { started = done; });
    const delayed = new Promise<string>((yes, no) => { resolve = yes; reject = no; });
    const expired = vi.fn();
    const forbidden = vi.fn();
    const refresh = vi.fn(async () => "refreshed-token");
    const execute = vi.fn(async (_token: string | null, context: { isRetry: boolean }) => {
      if (retry && !context.isRetry) throw { status: 401 };
      started();
      return delayed;
    });
    const pending = withAuthRetry({
      getAccessToken: () => "old-token", getSessionEpoch: () => epoch,
      execute, readStatus, refreshAccessToken: refresh,
      onSessionExpired: expired, onForbidden: forbidden,
    });
    const rejected = expect(pending).rejects.toMatchObject({ code: "AUTH_SESSION_EXPIRED", status: 401 });
    await ready;
    epoch += 1;
    if (status === null) resolve("old-account-private-data");
    else reject({ status });
    await rejected;
    expect(expired).not.toHaveBeenCalled();
    expect(forbidden).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledTimes(retry ? 1 : 0);
    expect(execute).toHaveBeenCalledTimes(retry ? 2 : 1);
  });

  it.each([false, true])("같은 세션의 성공 응답은 반환한다 (retry=%s)", async retry => {
    await expect(withAuthRetry({
      getAccessToken: () => "token", getSessionEpoch: () => 1,
      readStatus, refreshAccessToken: async () => "new-token",
      execute: async (_token, context) => {
        if (retry && !context.isRetry) throw { status: 401 };
        return "current-account-data";
      },
    })).resolves.toBe("current-account-data");
  });

  it("서로 다른 epoch의 refresh는 Promise를 공유하지 않는다", async () => {
    let epoch = 1; let resolve1!: (v: string) => void; let resolve2!: (v: string) => void;
    const refresh = vi.fn(() => new Promise<string>(r => { if (refresh.mock.calls.length === 1) resolve1 = r; else resolve2 = r; }));
    const make = () => withAuthRetry({ getAccessToken: () => "old", getSessionEpoch: () => epoch, refreshKey: "epoch-test", refreshAccessToken: refresh, readStatus, execute: async (_t, c) => { if (!c.isRetry) throw { status: 401 }; return "ok"; } });
    const first = make(); await Promise.resolve(); epoch = 2; const second = make(); await Promise.resolve(); resolve1("a"); resolve2("b"); await Promise.allSettled([first, second]); expect(refresh).toHaveBeenCalledTimes(2);
  });
});
