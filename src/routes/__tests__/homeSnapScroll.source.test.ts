// 역할: 홈 라우트 2섹션 스냅 정책이 소스에 선언되는지 검증합니다.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), "utf8");
}

describe("Home snap scroll source", () => {
  it("Home은 마운트 시 문서 스크롤에 home-snap-mode를 적용/해제한다", () => {
    const source = readSource("src/routes/home/Home.tsx");

    expect(source).toContain('const HOME_SNAP_MODE_CLASS = "home-snap-mode"');
    expect(source).toContain("document.documentElement.classList.add(HOME_SNAP_MODE_CLASS)");
    expect(source).toContain("document.body.classList.add(HOME_SNAP_MODE_CLASS)");
    expect(source).toContain("document.documentElement.classList.remove(HOME_SNAP_MODE_CLASS)");
    expect(source).toContain("document.body.classList.remove(HOME_SNAP_MODE_CLASS)");
  });

  it("Home의 1/2 섹션은 home-snap-section 클래스로 스냅 정렬된다", () => {
    const source = readSource("src/routes/home/Home.tsx");

    expect(source).toContain("home-snap-section");
    expect(source).toContain(
      "home-snap-section relative h-[100svh] overflow-hidden",
    );
    expect(source).toContain(
      "home-snap-section min-h-[100svh] scroll-mt-0 bg-[var(--surface)]",
    );
  });

  it("섹션 2 내부에는 Lineup 이후 CurrentPerformanceSection과 AdBanner가 이어서 배치된다", () => {
    const source = readSource("src/routes/home/Home.tsx");

    expect(source).toContain(
      `<LineupSection banners={lineups} />
          <div className="mt-[var(--home-section-performance-margin-top)]">
            <CurrentPerformanceSection />
          </div>

          <div>
            <AdBanner ads={allAds} />
          </div>`,
    );
  });

  it("index.css는 home-snap-mode와 home-snap-section 규칙을 선언한다", () => {
    const source = readSource("src/index.css");

    expect(source).toContain("html.home-snap-mode");
    expect(source).toContain("body.home-snap-mode");
    expect(source).toContain("scroll-snap-type: y mandatory;");
    expect(source).toContain(".home-snap-section");
    expect(source).toContain("scroll-snap-align: start;");
  });
});
