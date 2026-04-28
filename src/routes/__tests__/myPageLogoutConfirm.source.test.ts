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

  it("로그아웃 확인 액션은 과한 그라데이션 대신 단색 톤 버튼 클래스를 유지한다", () => {
    const source = readSource("src/routes/mypage/MyPage.tsx");

    expect(source).toContain("backgroundImage: \"none\"");
    expect(source).toContain("backgroundColor: \"var(--primary)\"");
    expect(source).toContain("boxShadow: \"none\"");
  });

  it("회원 탈퇴 진입점은 계정 관리에 낮은 강조 아이콘 행으로 배치한다", () => {
    const source = readSource("src/routes/mypage/MyPage.tsx");
    const styles = readSource("src/index.css");

    expect(source).toContain("withdrawConfirmOpen");
    expect(source).toContain("UserX");
    expect(source).toContain("회원 탈퇴");
    expect(source).toContain("openWithdrawDialog");
    expect(source).toContain("var(--mypage-withdraw-text)");
    expect(styles).toMatch(/--mypage-withdraw-text:\s*[^;]+;/);
  });

  it("회원 탈퇴 확인 시 DELETE /user/me 어댑터를 호출한다", () => {
    const source = readSource("src/routes/mypage/MyPage.tsx");
    const apiSource = readSource("src/api/app/auth/authApi.ts");

    expect(source).toContain("withdrawUser(accessToken)");
    expect(source).toContain("탈퇴하기");
    expect(source).toContain("정말 탈퇴할까요?");
    expect(source).toContain("계정 정보가 삭제되고 다시 로그인할 수 없어요.");
    expect(apiSource).toContain("export async function withdrawUser");
    expect(apiSource).toContain("method: \"DELETE\"");
    expect(apiSource).toContain("`${base}/user/me`");
  });

  it("회원 탈퇴는 티켓 권리포기 동의 후 최종 확인 단계에서만 실행한다", () => {
    const source = readSource("src/routes/mypage/MyPage.tsx");

    expect(source).toContain("type WithdrawStep");
    expect(source).toContain("ticket-waiver");
    expect(source).toContain("final");
    expect(source).toContain("withdrawTicketWaiverAgreed");
    expect(source).toContain("보유 티켓 권한 포기 동의");
    expect(source).toContain("보유 티켓이 사라지는 것에 동의합니다.");
    expect(source).toContain("setWithdrawStep(\"final\")");
    expect(source).toContain("withdrawStep === \"final\"");
    expect(source).toContain("disabled={!withdrawTicketWaiverAgreed || withdrawing}");
  });
});
