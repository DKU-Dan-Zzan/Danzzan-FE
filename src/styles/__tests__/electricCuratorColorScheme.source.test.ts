// 역할: electric curator 색상 스킴 토큰과 타이포/레이아웃 토큰 선언을 검증합니다.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const INDEX_CSS_PATH = path.resolve(__dirname, "../../index.css");

describe("electric curator color scheme source", () => {
  it("electric curator 스코프 토큰은 표면/타이포/간격 핵심 값을 선언한다", () => {
    const content = fs.readFileSync(INDEX_CSS_PATH, "utf8");

    expect(content).toContain('[data-color-scheme="electric-curator"]');
    expect(content).toContain("--surface: #f8fafb;");
    expect(content).toContain("--surface_container: #e8eef1;");
    expect(content).toContain("--surface_container_low: #f0f4f6;");
    expect(content).toContain("--surface_container_lowest: #ffffff;");
    expect(content).toContain("--surface_container_high: #e3ebee;");
    expect(content).toContain("--primary: #8fa9be;");
    expect(content).toContain("--primary_container: #cbe6fc;");
    expect(content).toContain("--secondary: #f5b070;");
    expect(content).toContain("--secondary_container: #fcd6af;");
    expect(content).toContain("--tertiary: #f28c82;");
    expect(content).toContain("--tertiary_container: #fab79a;");
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
