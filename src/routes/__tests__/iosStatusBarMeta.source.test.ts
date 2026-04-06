// 역할: iOS 홈화면(PWA)에서 status bar overlay 동작을 위한 index.html 메타를 검증합니다.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const INDEX_HTML_PATH = path.join(PROJECT_ROOT, "index.html");

describe("iOS status bar meta source", () => {
  it("apple-mobile-web-app-status-bar-style은 black-translucent여야 한다", () => {
    const source = fs.readFileSync(INDEX_HTML_PATH, "utf8");

    expect(source).toContain('name="theme-color" content="#e2e8f0"');
    expect(source).toContain('name="apple-mobile-web-app-capable" content="yes"');
    expect(source).toContain('name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"');
    expect(source).toContain('name="apple-mobile-web-app-status-bar-style" content="black-translucent"');
  });
});
