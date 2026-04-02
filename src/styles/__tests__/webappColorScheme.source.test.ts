// 역할: 웹앱 전용 색상 스킴 토큰이 index.css에 선언되어 있는지 검증합니다.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const INDEX_CSS_PATH = path.resolve(__dirname, "../../index.css");

describe("webapp color scheme source", () => {
  it("웹앱 스코프 토큰은 ink/neural/paper 팔레트와 semantic 매핑을 선언한다", () => {
    const content = fs.readFileSync(INDEX_CSS_PATH, "utf8");

    expect(content).toContain('[data-color-scheme="webapp"]');
    expect(content).toContain("--ink-900: #131d3b;");
    expect(content).toContain("--ink-800: #18254a;");
    expect(content).toContain("--ink-700: #1d2c59;");
    expect(content).toContain("--ink-600: #203163;");
    expect(content).toContain("--ink-500: #3b4a76;");
    expect(content).toContain("--ink-400: #5e6b8f;");
    expect(content).toContain("--ink-300: #8b94ae;");
    expect(content).toContain("--neutral-300: #e3e8ef;");
    expect(content).toContain("--neutral-100: #f7f7f7;");
    expect(content).toContain("--paper-50: #fefaf7;");
    expect(content).toContain("--webapp-header-bar: var(--neutral-300);");
    expect(content).toContain("--webapp-bottom-bar: var(--neutral-300);");
    expect(content).toContain("--webapp-footer-bg: #f6f7f9;");
    expect(content).toContain("--webapp-main-bg: var(--paper-50);");
    expect(content).toContain("--bg-base: var(--webapp-main-bg);");
    expect(content).toContain("--bg-page-soft: var(--webapp-main-bg);");
    expect(content).toContain("--app-overscroll-bg: var(--webapp-main-bg);");
    expect(content).toContain("--text-body-deep: var(--ink-600);");
    expect(content).toContain("--text-emphasis-vivid: #2853a9;");
    expect(content).toContain("--text-emphasis-vivid-strong: #2f63f6;");
    expect(content).toContain("--text-bold-emphasis: #374f84;");
    expect(content).toContain("--webapp-text-main: var(--text-body-deep);");
    expect(content).toContain("--webapp-text-emphasis: var(--text-body-deep);");
    expect(content).toContain("--webapp-text-vivid: var(--text-emphasis-vivid);");
    expect(content).toContain("--webapp-text-bold-emphasis: var(--text-bold-emphasis);");
    expect(content).toContain("--webapp-surface-text-bg: var(--neutral-100);");
    expect(content).toContain("--surface-tint-emphasis: rgba(227, 232, 239, 0.9);");
    expect(content).toContain("--webapp-button-primary: var(--ink-500);");
    expect(content).toContain("--webapp-button-disabled: var(--ink-300);");
    expect(content).toContain("--webapp-caution-bg: #f9ece4;");
    expect(content).toContain("--app-header-bg-gradient: none;");
    expect(content).toContain("--app-header-border: transparent;");
    expect(content).toContain("--app-nav-bg: var(--webapp-bottom-bar);");
    expect(content).toContain("--footer-bg: var(--webapp-footer-bg);");
    expect(content).toContain("--home-notice-bg-start: var(--neutral-100);");
    expect(content).toContain("--home-notice-bg-end: var(--neutral-100);");
    expect(content).toContain("--home-notice-border: transparent;");
    expect(content).toContain("--home-lineup-caption-color: var(--text-body-deep);");
    expect(content).toContain("--home-ad-banner-border: #bdd0f7e6;");
    expect(content).toContain("--home-ad-banner-bg: #ffffff;");
    expect(content).toContain("--mypage-portal-card-bg-start: rgba(227, 232, 239, 0.92);");
    expect(content).toContain("--mypage-portal-card-bg-mid: rgba(227, 232, 239, 0.78);");
    expect(content).toContain("--mypage-portal-card-bg-end: rgba(247, 247, 247, 0.96);");
    expect(content).toContain("--color-ink-900: var(--ink-900);");
    expect(content).toContain("--color-ink-600: var(--ink-600);");
    expect(content).toContain("--color-neutral-300: var(--neutral-300);");
    expect(content).toContain("--color-paper-50: var(--paper-50);");
    expect(content).toContain("--color-text-emphasis-vivid-strong: var(--text-emphasis-vivid-strong);");
  });
});
