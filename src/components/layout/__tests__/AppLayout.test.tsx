// 역할: 일반 사용자 AppLayout 루트가 웹앱 색상 스킴을 선언하는지 검증합니다.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Route, Routes } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";
import AppLayout from "@/components/layout/AppLayout";

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
  it("일반 사용자 레이아웃 루트에 data-color-scheme=electric-curator를 선언한다", () => {
    const markup = renderAppLayout("/");

    expect(markup).toContain('data-color-scheme="electric-curator"');
  });

  it("footer는 mypage에서만 노출된다", () => {
    const homeMarkup = renderAppLayout("/");
    const myPageMarkup = renderAppLayout("/mypage");

    expect(homeMarkup).not.toContain("Developed by DAN-ZZAN");
    expect(myPageMarkup).toContain("Developed by DAN-ZZAN");
  });
});
