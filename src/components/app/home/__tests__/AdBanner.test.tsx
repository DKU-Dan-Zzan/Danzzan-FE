// 역할: 홈 광고 배너가 홈 전용 토큰을 사용하고 타임테이블 토큰에 의존하지 않는지 검증합니다.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdBanner from "@/components/app/home/AdBanner";

describe("AdBanner", () => {
  it("홈 전용 배너 토큰을 사용한다", () => {
    const markup = renderToStaticMarkup(<AdBanner ads={[]} />);

    expect(markup).toContain("border-[var(--home-ad-banner-border)]");
    expect(markup).toContain("bg-[var(--home-ad-banner-bg)]");
    expect(markup).not.toContain("timetable-card-border");
    expect(markup).not.toContain("timetable-card-bg");
  });
});
