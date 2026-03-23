// 역할: 관리자 로그인 두 화면이 동일한 제목 스타일 상수를 공유하는지 소스 스캔으로 검증합니다.

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), "utf8");
}

describe("Admin login title style consistency", () => {
  it("공지/팔찌 관리자 로그인은 동일 제목 스타일 상수를 사용한다", () => {
    const sharedStyle = readSource("src/lib/common/adminLoginHeadingStyles.ts");
    const adminLogin = readSource("src/routes/admin/AdminLogin.tsx");
    const ticketAdminLogin = readSource("src/routes/ticketing/admin/login/AdminLogin.tsx");

    expect(sharedStyle).toContain("export const ADMIN_LOGIN_TITLE_CLASS");
    expect(sharedStyle).toContain("font-black");
    expect(sharedStyle).toContain("md:text-[34px]");

    expect(adminLogin).toContain(
      'import { ADMIN_LOGIN_TITLE_CLASS } from "@/lib/common/adminLoginHeadingStyles";',
    );
    expect(ticketAdminLogin).toContain(
      'import { ADMIN_LOGIN_TITLE_CLASS } from "@/lib/common/adminLoginHeadingStyles";',
    );

    expect(adminLogin).toContain("className={ADMIN_LOGIN_TITLE_CLASS}");
    expect(ticketAdminLogin).toContain("className={ADMIN_LOGIN_TITLE_CLASS}");
  });
});

