import {
  resolveRoleFromAccessToken,
  withAuthRetry,
} from "@/api/common/authCore";

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
});
