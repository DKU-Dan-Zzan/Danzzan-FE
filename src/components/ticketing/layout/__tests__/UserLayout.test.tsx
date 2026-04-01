// 역할: 티켓팅 사용자 레이아웃의 헤더 고정 동작을 검증합니다.
import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Route, Routes } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";
import { UserLayout } from "@/components/ticketing/layout/UserLayout";
import { authStore } from "@/store/common/authStore";

const createJwtLikeToken = (payload: Record<string, unknown>): string => {
  const encode = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
};

function renderUserLayout(pathname: string) {
  return renderToStaticMarkup(
    <StaticRouter location={pathname}>
      <Routes>
        <Route path="/ticket/*" element={<UserLayout />}>
          <Route path="ticketing" element={<div>ticketing content</div>} />
          <Route path="my-ticket" element={<div>my-ticket content</div>} />
          <Route path="login" element={<div>login content</div>} />
        </Route>
      </Routes>
    </StaticRouter>,
  );
}

describe("UserLayout", () => {
  afterEach(() => {
    authStore.clear();
  });

  it("학생 인증 상태 티켓팅 페이지에서는 헤더를 상단 fixed로 고정한다", () => {
    authStore.setSession(
      {
        tokens: {
          accessToken: createJwtLikeToken({ role: "ROLE_USER" }),
          refreshToken: "",
          expiresIn: null,
        },
        user: null,
      },
      "student",
    );

    const markup = renderUserLayout("/ticket/ticketing");

    expect(markup).toContain("fixed inset-x-0 top-0 z-40");
    expect(markup).toContain("pt-[calc(env(safe-area-inset-top)+4rem)]");
    expect(markup).not.toContain("sticky top-0 z-40");
    expect(markup).toContain('data-color-scheme="webapp"');
  });
});
