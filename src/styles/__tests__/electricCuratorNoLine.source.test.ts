// 역할: electric curator 1차 마이그레이션 영역에서 섹션 구분선(border) 사용 금지를 검증합니다.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), "utf8");
}

describe("electric curator no-line source", () => {
  it("AppTopBar/BottomNav/Footer는 섹션 border 유틸리티를 사용하지 않는다", () => {
    const appTopBar = readSource("src/components/layout/AppTopBar.tsx");
    const bottomNav = readSource("src/components/layout/BottomNav.tsx");
    const footer = readSource("src/components/layout/Footer.tsx");

    expect(appTopBar).not.toContain("border-b");
    expect(appTopBar).not.toContain("border-[var(--app-header-border)]");

    expect(bottomNav).not.toContain("border-t");
    expect(bottomNav).not.toContain("border-[var(--app-nav-border)]");

    expect(footer).not.toContain("border-[var(--footer-divider)]");
    expect(footer).not.toContain("border-[var(--footer-icon-border)]");
  });

  it("Home 핵심 블록은 기본 컨테이너 경계를 border가 아닌 표면 톤 전환으로 처리한다", () => {
    const emergencyNotice = readSource("src/components/app/home/EmergencyNotice.tsx");
    const posterCarousel = readSource("src/components/app/home/PosterCarousel.tsx");
    const lineupCarousel = readSource("src/components/app/home/LineupCarousel.tsx");
    const adBanner = readSource("src/components/app/home/AdBanner.tsx");
    const currentPerformance = readSource("src/components/app/home/CurrentPerformanceSection.tsx");

    expect(emergencyNotice).not.toContain("border-[var(--home-notice-border)]");
    expect(posterCarousel).not.toContain("home-card-border");
    expect(lineupCarousel).not.toContain("home-lineup-card-border");
    expect(adBanner).not.toContain("home-ad-banner-border");
    expect(currentPerformance).not.toContain("border-[var(--home-card-border)]");
  });
});
