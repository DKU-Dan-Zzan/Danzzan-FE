// 역할: 홈/티켓팅 헤더 버튼이 아이콘 전용 스타일을 사용하는지 검증합니다.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const HEADER_PATH = path.resolve(__dirname, "../Header.tsx");
const USER_LAYOUT_PATH = path.resolve(__dirname, "../../ticketing/layout/UserLayout.tsx");

describe("app header round button style source", () => {
  it("홈 헤더 버튼과 티켓팅 뒤로가기 버튼은 모두 아이콘 전용 스타일을 사용한다", () => {
    const headerSource = fs.readFileSync(HEADER_PATH, "utf8");
    const userLayoutSource = fs.readFileSync(USER_LAYOUT_PATH, "utf8");

    expect(headerSource).toContain("HEADER_ICON_BUTTON_CLASS");
    expect(userLayoutSource).toContain("HEADER_ICON_BUTTON_CLASS");
    expect(headerSource).not.toContain("APP_HEADER_ROUND_BUTTON_BASE_CLASS");
    expect(userLayoutSource).not.toContain("APP_HEADER_ROUND_BUTTON_BASE_CLASS");
    expect(headerSource).toContain('className={`${HEADER_ICON_BUTTON_CLASS} right-[4.25rem]`}');
    expect(headerSource).toContain('className={`${HEADER_ICON_BUTTON_CLASS} right-4`}');
    expect(userLayoutSource).toContain('className={`${HEADER_ICON_BUTTON_CLASS} left-4`}');
  });

  it("티켓팅 뒤로가기 아이콘 크기를 홈 헤더 액션 버튼과 맞춘다", () => {
    const userLayoutSource = fs.readFileSync(USER_LAYOUT_PATH, "utf8");

    expect(userLayoutSource).toContain("<ArrowLeft size={20}");
  });
});
