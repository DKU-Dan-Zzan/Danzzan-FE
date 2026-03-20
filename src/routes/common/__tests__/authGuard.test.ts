import {
  buildLoginRedirectPath,
  buildReturnTo,
  isRoleAuthenticated,
  resolveScopedRedirect,
} from "@/routes/common/authGuard";

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
});
