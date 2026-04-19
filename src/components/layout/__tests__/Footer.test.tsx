// 역할: 앱 Footer가 웹앱 시안에 맞는 구조와 SNS 아이콘 링크를 노출하는지 검증합니다.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import Footer from "@/components/layout/Footer";

function renderFooter() {
  return renderToStaticMarkup(
    <StaticRouter location="/mypage">
      <Footer />
    </StaticRouter>,
  );
}

describe("Footer", () => {
  it("브랜드/카피와 Instagram, YouTube 아이콘 링크를 노출한다", () => {
    const markup = renderFooter();

    expect(markup).toContain("주최 단국대학교 죽전캠퍼스 제58대 LOU:D 총학생회");
    expect(markup).toContain("Developed by DAN-ZZAN | © 2026 All rights reserved.");
    expect(markup).not.toContain("2026 DAN-ZZAN FESTIVAL WEB APP");
    expect(markup).not.toContain("rounded-2xl border");
    expect(markup).not.toContain("font-bold");
    expect(markup).not.toContain("font-semibold");
    expect(markup).toContain("LOU:D 총학생회 Instagram · YouTube");
    expect(markup).not.toContain("LOU:D 총학생회 공식 채널");
    expect(markup).not.toContain("개발 DAN-ZZAN");
    expect(markup.indexOf("주최 단국대학교 죽전캠퍼스 제58대 LOU:D 총학생회")).toBeLessThan(
      markup.indexOf("Developed by DAN-ZZAN | © 2026 All rights reserved."),
    );
    expect(markup.indexOf("LOU:D 총학생회 Instagram · YouTube")).toBeLessThan(
      markup.indexOf('aria-label="Instagram"'),
    );
    expect(markup).not.toContain("@dku_loud");
    expect(markup).not.toContain("@2026라우드총학생회");
    expect(markup).toContain('aria-label="Instagram"');
    expect(markup).toContain('href="https://www.instagram.com/dku_loud/"');
    expect(markup).toContain('aria-label="YouTube"');
    expect(markup).toContain(
      'href="https://www.youtube.com/@2026%EB%9D%BC%EC%9A%B0%EB%93%9C%EC%B4%9D%ED%95%99%EC%83%9D%ED%9A%8C"',
    );
    expect(markup).toContain('<rect x="1.75" y="5" width="20.5" height="14" rx="4.8" fill="currentColor"');
    expect(markup).toContain('class="h-[22px] w-[22px]"');
    expect(markup).toContain("© 2026 All rights reserved.");
    expect(markup).toContain(">개인정보처리방침<");
    expect(markup).toContain('href="/legal/privacy"');
    expect(markup).toContain(">이용약관<");
    expect(markup).toContain('href="/legal/terms"');
  });
});
