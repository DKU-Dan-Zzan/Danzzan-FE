// 역할: 회원가입 Step2 문자 인증 안내 문구 회귀를 검증합니다.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SIGNUP_ROUTE_PATH = path.resolve(__dirname, "../signup/Signup.tsx");

describe("ticket signup phone verification guide source", () => {
  it("인증코드 발급 버튼 라벨을 문자 인증코드 발급으로 유지한다", () => {
    const content = fs.readFileSync(SIGNUP_ROUTE_PATH, "utf8");

    expect(content).toContain("문자 인증코드 발급");
  });

  it("인증코드 카드 상단에 2줄 안내 문구를 유지한다", () => {
    const content = fs.readFileSync(SIGNUP_ROUTE_PATH, "utf8");

    expect(content).toContain("인증코드를 복사해");
    expect(content).toContain("으로 문자 전송해주세요.");
    expect(content).toContain("해당 번호는 문자 수신 전용 번호입니다. 통화로는 인증되지 않아요.");
  });

  it("카드 내부의 고정 3단계 안내 문구를 유지한다", () => {
    const content = fs.readFileSync(SIGNUP_ROUTE_PATH, "utf8");

    expect(content).toContain("1) 인증코드 복사");
    expect(content).toContain("2) 문자 앱에서");
    expect(content).toContain("3) 이 화면으로 돌아와");
    expect(content).toContain("인증 확인 버튼 클릭");
  });
});
