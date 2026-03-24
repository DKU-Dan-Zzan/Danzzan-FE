// 역할: Home 라우트 소스의 로딩 정책 분기(core/accessory/inline spinner)가 유지되는지 정적 회귀를 검증합니다.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

function readSource(relativePath: string) {
  const absolutePath = path.join(PROJECT_ROOT, relativePath);
  return fs.readFileSync(absolutePath, "utf8");
}

describe("Home loading policy", () => {
  it("Home은 핵심/부가 pending 상태를 분리해 렌더링한다", () => {
    const source = readSource("src/routes/home/Home.tsx");

    expect(source).toContain("const corePending =");
    expect(source).toContain("const accessoryPending =");
    expect(source).toContain("const shouldShowInlineSpinner =");
    expect(source).toContain("const adImageUrl =");
  });

  it("Home은 로딩 텍스트 대신 지연 스피너 기반 표시를 사용한다", () => {
    const source = readSource("src/routes/home/Home.tsx");

    expect(source).toContain("import DelayedSpinner from \"@/components/common/loading/DelayedSpinner\"");
    expect(source).toContain("<DelayedSpinner");
    expect(source).not.toContain("로딩 중...");
  });
});
