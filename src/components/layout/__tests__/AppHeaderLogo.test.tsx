// 역할: 헤더 로고의 기본 렌더링 및 사이즈 토큰 적용을 검증합니다.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppHeaderLogo } from "@/components/layout/AppHeaderLogo";

describe("AppHeaderLogo", () => {
  it("기본 로고 이미지를 좌측 정렬된 헤더 위치로 렌더링한다", () => {
    const markup = renderToStaticMarkup(<AppHeaderLogo />);

    expect(markup).toContain('src="/DAN-ZZAN.png"');
    expect(markup).toContain('alt="DAN-ZZAN"');
    expect(markup).toContain("left-4");
    expect(markup).toContain("h-8");
    expect(markup).toContain("w-[136px]");
  });
});
