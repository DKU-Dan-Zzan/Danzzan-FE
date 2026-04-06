// 역할: BottomNav 런타임 오프셋 계산이 초기 애니메이션 이후에도 재보정되는지 검증합니다.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = path.resolve(__dirname, "../../../..");

function readSource(relativePath: string) {
  const absolutePath = path.join(PROJECT_ROOT, relativePath);
  return fs.readFileSync(absolutePath, "utf8");
}

describe("BottomNav runtime offset source", () => {
  it("BottomNav는 animationend 이후에도 오프셋을 다시 계산한다", () => {
    const source = readSource("src/components/layout/BottomNav.tsx");

    expect(source).toContain("const APP_BOTTOM_NAV_RUNTIME_OFFSET_VAR = \"--app-bottom-nav-runtime-offset\";");
    expect(source).toContain("const updateBottomOffset = () => {");
    expect(source).toContain("window.innerHeight - navTop");
    expect(source).toContain("navElement.addEventListener(\"animationend\", updateBottomOffset)");
    expect(source).toContain("navElement.removeEventListener(\"animationend\", updateBottomOffset)");
  });
});

