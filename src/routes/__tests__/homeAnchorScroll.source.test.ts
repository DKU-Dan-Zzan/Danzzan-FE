// 역할: Home 라우트가 앵커 스크롤 로직을 연결하는지 정적 회귀를 검증합니다.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), "utf8");
}

describe("Home anchor scroll source", () => {
  it("Home은 앵커 트리거 유틸을 가져와 스크롤/터치 입력에서 사용한다", () => {
    const source = readSource("src/routes/home/Home.tsx");

    expect(source).toContain("shouldTriggerHomeAnchor");
    expect(source).toContain("shouldReleaseHomeAnchorLock");
    expect(source).toContain("lineupAnchorRef");
    expect(source).toContain("scrollIntoView({ behavior: \"smooth\", block: \"start\" })");
    expect(source).toContain("addEventListener(\"wheel\"");
    expect(source).toContain("addEventListener(\"touchmove\"");
  });

  it("Home은 둥실둥실 스크롤 유도 화살표 버튼을 렌더링하고 앵커 이동에 연결한다", () => {
    const source = readSource("src/routes/home/Home.tsx");

    expect(source).toContain("home-scroll-cue-arrow");
    expect(source).toContain("viewBox=\"0 0 64 24\"");
    expect(source).toContain("스크롤하여 올해의 아티스트를 확인해보세요");
    expect(source).toContain("ec-scroll-cue-twinkle");
    expect(source).toContain("home-hero-bottom-vignette");
    expect(source).toContain("aria-label=\"아티스트 섹션으로 이동\"");
    expect(source).toContain("onClick={scrollToLineupAnchor}");
    expect(source).toContain("ec-scroll-cue-float");
  });
});
