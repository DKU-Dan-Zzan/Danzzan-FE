import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Route, Routes } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";
import AppLayout from "@/components/layout/AppLayout";
import { authStore } from "@/store/common/authStore";

function renderAppLayout(pathname: string) {
  return renderToStaticMarkup(
    <StaticRouter location={pathname}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>home</div>} />
          <Route path="/notice" element={<div>notice</div>} />
          <Route path="/mypage" element={<div>mypage</div>} />
        </Route>
      </Routes>
    </StaticRouter>,
  );
}

describe("AppLayout", () => {
  afterEach(() => {
    authStore.clear();
  });

  it("일반 사용자 레이아웃 루트에 data-color-scheme=electric-curator를 선언한다", () => {
    const markup = renderAppLayout("/");

    expect(markup).toContain('data-color-scheme="electric-curator"');
  });

  it("footer는 로그인된 mypage에서만 노출된다", () => {
    const homeMarkup = renderAppLayout("/");
    const guestMyPageMarkup = renderAppLayout("/mypage");

    authStore.setSession(
      {
        tokens: {
          accessToken: "student-access-token",
          refreshToken: "",
          expiresIn: null,
        },
        user: {
          studentId: "32200000",
          name: "테스트 사용자",
          role: "student",
        },
      },
      "student",
      { persist: false },
    );

    const authenticatedMyPageMarkup = renderAppLayout("/mypage");

    expect(homeMarkup).not.toContain("Developed by DAN-ZZAN");
    expect(guestMyPageMarkup).not.toContain("Developed by DAN-ZZAN");
    expect(authenticatedMyPageMarkup).toContain("Developed by DAN-ZZAN");
  });
});
