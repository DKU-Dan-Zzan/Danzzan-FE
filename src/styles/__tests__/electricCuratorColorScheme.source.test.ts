// 역할: electric curator 색상 스킴 토큰과 타이포/레이아웃 토큰 선언을 검증합니다.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const INDEX_CSS_PATH = path.resolve(__dirname, "../../index.css");

describe("electric curator color scheme source", () => {
  it("electric curator 스코프 토큰은 표면/타이포/간격 핵심 값을 선언한다", () => {
    const content = fs.readFileSync(INDEX_CSS_PATH, "utf8");

    expect(content).toContain('[data-color-scheme="electric-curator"]');
    expect(content).toContain("--surface: rgb(248 250 251);");
    expect(content).toContain("--surface_container: rgb(232 238 241);");
    expect(content).toContain("--surface_container_low: rgb(240 244 246);");
    expect(content).toContain("--surface_container_lowest: #ffffff;");
    expect(content).toContain("--surface_container_high: rgb(227 235 238);");
    expect(content).toContain("--primary: rgb(143 169 190);");
    expect(content).toContain("--primary_container: rgb(203 230 252);");
    expect(content).toContain("--secondary: rgb(245 176 112);");
    expect(content).toContain("--secondary_container: rgb(252 214 175);");
    expect(content).toContain("--tertiary: rgb(242 140 130);");
    expect(content).toContain("--tertiary_container: rgb(250 183 154);");
    expect(content).toContain("--outline_variant: rgba(172, 179, 182, 0.15);");
    expect(content).toContain("--ec-glass-bg: rgba(248, 250, 251, 0.7);");
    expect(content).toContain("--ec-glass-blur: 28px;");
    expect(content).toContain("--ec-ambient-shadow: 0 20px 50px rgba(44, 52, 54, 0.06);");
    expect(content).toContain("--font-display: \"Manrope\", \"Plus Jakarta Sans\", \"Inter\", \"Noto Sans KR\", system-ui, -apple-system, \"Segoe UI\", sans-serif;");
    expect(content).toContain("--font-body: \"Plus Jakarta Sans\", \"Inter\", \"Noto Sans KR\", system-ui, -apple-system, \"Segoe UI\", sans-serif;");
    expect(content).toContain("--type-display-lg-size: 3.5rem;");
    expect(content).toContain("--type-display-lg-tracking: -0.02em;");
    expect(content).toContain("--type-label-md-tracking: 0.04em;");
    expect(content).toContain("--spacing-4: 1rem;");
    expect(content).toContain("--spacing-6: 1.5rem;");
    expect(content).toContain("--spacing-8: 2rem;");
    expect(content).toContain("--radius-md: 0.75rem;");
    expect(content).toContain("--radius-lg: 1.25rem;");
    expect(content).toContain("--radius-xl: 1.5rem;");
  });
});
