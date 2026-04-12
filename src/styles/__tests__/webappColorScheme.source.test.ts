// 역할: 웹앱 전용 색상 스킴의 핵심 토큰/매핑이 유지되는지 검증합니다.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const INDEX_CSS_PATH = path.resolve(__dirname, "../../index.css");

describe("webapp color scheme source", () => {
  it("웹앱 스코프와 핵심 semantic 토큰을 선언한다", () => {
    const content = fs.readFileSync(INDEX_CSS_PATH, "utf8");

    // 스코프
    expect(content).toContain('[data-color-scheme="webapp"]');

    // 핵심 팔레트 토큰(값 자체보다 토큰 존재/연결 확인)
    const requiredPaletteTokens = [
      "--ink-900:",
      "--ink-600:",
      "--neutral-300:",
      "--neutral-100:",
      "--paper-50:",
      "--webapp-header-bar:",
      "--webapp-main-bg:",
      "--webapp-bottom-bar:",
      "--webapp-footer-bg:",
    ];

    for (const token of requiredPaletteTokens) {
      expect(content).toContain(token);
    }

    // 앱 전역에 연결되는 semantic 매핑
    expect(content).toContain("--bg-base: var(--webapp-main-bg);");
    expect(content).toContain("--bg-page-soft: var(--webapp-main-bg);");
    expect(content).toContain("--app-nav-bg: var(--webapp-bottom-bar);");
    expect(content).toContain("--footer-bg: var(--webapp-footer-bg);");
    expect(content).toContain("--app-header-bg-gradient: none;");
    expect(content).toContain("--app-header-border: transparent;");
  });
});
