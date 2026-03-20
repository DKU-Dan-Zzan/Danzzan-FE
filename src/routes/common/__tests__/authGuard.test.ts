import {
  buildLoginRedirectPath,
  buildReturnTo,
  isRoleAuthenticated,
  resolveScopedRedirect,
} from "@/routes/common/authGuard";

const createJwtLikeToken = (payload: Record<string, unknown>): string => {
  const encode = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
};

describe("authGuard", () => {
  it("scope 밖 redirect는 fallback으로 치환한다", () => {
    expect(
      resolveScopedRedirect("/ticket/admin/wristband", {
        scope: "/admin",
        fallback: "/admin",
      }),
    ).toBe("/admin");
  });

  it("scope 안 redirect는 그대로 허용한다", () => {
    expect(
      resolveScopedRedirect("/admin/map?tab=1", {
        scope: "/admin",
        fallback: "/admin",
      }),
    ).toBe("/admin/map?tab=1");
  });

  it("returnTo와 login redirect query를 생성한다", () => {
    const returnTo = buildReturnTo("/admin/map", "?q=1");
    expect(returnTo).toBe("/admin/map?q=1");
    expect(buildLoginRedirectPath("/admin/login", returnTo)).toBe(
      "/admin/login?redirect=%2Fadmin%2Fmap%3Fq%3D1",
    );
  });

  it("토큰+역할이 모두 맞아야 인증 상태로 본다", () => {
    expect(
      isRoleAuthenticated({
        accessToken: "token",
        role: "admin",
        requiredRole: "admin",
      }),
    ).toBe(true);
    expect(
      isRoleAuthenticated({
        accessToken: "token",
        role: "student",
        requiredRole: "admin",
      }),
    ).toBe(false);
  });

  it("role 상태값이 비어도 토큰 role 클레임으로 인증을 판별한다", () => {
    const token = createJwtLikeToken({ role: "ROLE_ADMIN" });

    expect(
      isRoleAuthenticated({
        accessToken: token,
        role: null,
        requiredRole: "admin",
      }),
    ).toBe(true);
  });
});
