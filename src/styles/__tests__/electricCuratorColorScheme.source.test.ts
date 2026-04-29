// 역할: electric curator 색상 스킴 토큰과 타이포/레이아웃 토큰 선언을 검증합니다.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const INDEX_CSS_PATH = path.resolve(__dirname, "../../index.css");

describe("electric curator color scheme source", () => {
  it("electric curator 스코프 토큰은 표면/타이포/간격 핵심 값을 선언한다", () => {
    const content = fs.readFileSync(INDEX_CSS_PATH, "utf8");

    expect(content).toContain('[data-color-scheme="electric-curator"]');

    // 값 고정보다 "토큰 존재/연결" 중심으로 검증한다.
    const requiredTokens = [
      "--surface:",
      "--surface_container:",
      "--surface_container_low:",
      "--surface_container_lowest:",
      "--surface_container_high:",
      "--primary:",
      "--primary_container:",
      "--secondary:",
      "--secondary_container:",
      "--tertiary:",
      "--tertiary_container:",
      "--outline_variant:",
      "--ec-glass-bg:",
      "--ec-glass-blur:",
      "--ec-ambient-shadow:",
      "--font-display:",
      "--font-body:",
      "--type-display-lg-size:",
      "--type-display-lg-tracking:",
      "--type-label-md-tracking:",
      "--spacing-4:",
      "--spacing-6:",
      "--spacing-8:",
      "--radius-md:",
      "--radius-lg:",
      "--radius-xl:",
    ];

    for (const token of requiredTokens) {
      expect(content).toContain(token);
    }
  });
});
