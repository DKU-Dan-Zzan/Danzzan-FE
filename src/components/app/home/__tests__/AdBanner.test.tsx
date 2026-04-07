// 역할: 홈 광고 배너가 홈 전용 토큰을 사용하고 타임테이블 토큰에 의존하지 않는지 검증합니다.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdBanner from "@/components/app/home/AdBanner";

describe("AdBanner", () => {
  it("홈 전용 배너 토큰을 사용한다", () => {
    const markup = renderToStaticMarkup(<AdBanner ads={[]} />);

    expect(markup).toContain("mt-9");
    expect(markup).toContain("relative");
    expect(markup).toContain("aspect-[9/2]");
    expect(markup).not.toContain("fixed");
    expect(markup).not.toContain("bottom-[calc(var(--app-bottom-nav-runtime-offset)-1px)]");
    expect(markup).not.toContain("max-w-[var(--app-mobile-shell-max-width)]");
    expect(markup).toContain("rounded-none");
    expect(markup).not.toContain("rounded-[var(--radius-xl)]");
    expect(markup).toContain("bg-[var(--home-ad-banner-bg)]");
    expect(markup).not.toContain("timetable-card-border");
    expect(markup).not.toContain("timetable-card-bg");
  });
});
