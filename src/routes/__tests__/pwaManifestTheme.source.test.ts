// 역할: iOS 설치형 웹앱 상단 바와 스플래시 컬러가 홈 포스터 톤과 맞는지 vite PWA manifest 소스를 검증합니다.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const VITE_CONFIG_PATH = path.join(PROJECT_ROOT, "vite.config.ts");

describe("PWA manifest theme source", () => {
  it("manifest theme/background color를 아이콘 배경 톤(#ffffff)으로 고정한다", () => {
    const source = fs.readFileSync(VITE_CONFIG_PATH, "utf8");

    expect(source).toContain('theme_color: "#ffffff"');
    expect(source).toContain('background_color: "#ffffff"');
  });
});

