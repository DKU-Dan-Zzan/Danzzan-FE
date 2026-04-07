// 역할: MyPage 로그아웃 확인 다이얼로그 연결이 유지되는지 소스 회귀를 검증합니다.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

function readSource(relativePath: string) {
  const absolutePath = path.join(PROJECT_ROOT, relativePath);
  return fs.readFileSync(absolutePath, "utf8");
}

describe("MyPage logout confirm source", () => {
  it("로그아웃 클릭 시 확인 다이얼로그를 렌더링하도록 소스를 유지한다", () => {
    const source = readSource("src/routes/mypage/MyPage.tsx");

    expect(source).toContain("AlertDialog");
    expect(source).toContain("logoutConfirmOpen");
    expect(source).toContain("setLogoutConfirmOpen(true)");
    expect(source).toContain("정말 로그아웃하시겠어요?");
    expect(source).toContain("AlertDialogCancel");
    expect(source).toContain("AlertDialogAction");
  });
});
