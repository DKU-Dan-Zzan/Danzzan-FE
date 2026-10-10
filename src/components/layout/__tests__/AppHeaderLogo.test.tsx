// 역할: 헤더 로고의 기본 렌더링 및 사이즈 토큰 적용을 검증합니다.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppHeaderLogo } from "@/components/layout/AppHeaderLogo";
import { FestivalBrandingContext } from "@/lib/app/festival/FestivalBrandingProvider";

describe("AppHeaderLogo", () => {
  it("기본 로고 이미지를 좌측 정렬된 헤더 위치로 렌더링한다", () => {
    const markup = renderToStaticMarkup(<AppHeaderLogo />);

    expect(markup).toContain('src="/legend-logo.png"');
    expect(markup).toContain('alt="LEGEND"');
    expect(markup).toContain("left-4");
    expect(markup).toContain("object-contain");
    expect(markup).toContain("object-left");
    expect(markup).toMatch(/\sh-\d+/);
    expect(markup).toMatch(/w-\[[0-9]+px\]/);
  });

  it("공통 헤더 로고에 현재 축제의 공식 로고 URL을 사용한다", () => {
    const markup = renderToStaticMarkup(<FestivalBrandingContext.Provider value={{ festivalSettingId: 1, logoImageUrl: "https://cdn.example.com/festival-logo.png", posterImageUrl: null }}>
      <AppHeaderLogo />
    </FestivalBrandingContext.Provider>);
    expect(markup).toContain('src="https://cdn.example.com/festival-logo.png"');
    expect(markup).toContain('alt="축제 로고"');
    expect(markup).toContain("h-7 w-[98px]");
  });
});
