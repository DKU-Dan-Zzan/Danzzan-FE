// 역할: 티켓팅 도메인 동작을 검증하는 테스트 모듈입니다.
import { describe, expect, it } from "vitest";
import {
  getPasswordPolicyErrorMessage,
  getPasswordPolicyState,
  isPasswordPolicyErrorMessage,
  PASSWORD_CONFIRM_MISMATCH_ERROR_MESSAGE,
  PASSWORD_POLICY_ERROR_MESSAGE,
} from "@/lib/ticketing/passwordPolicy";

describe("passwordPolicy", () => {
  it("7자 비밀번호는 특수문자가 있어도 최소 길이 조건을 통과하지 못한다", () => {
    const state = getPasswordPolicyState("abc12!@", "abc12!@");

    expect(state).toEqual({
      hasMinLength: false,
      hasSpecialChar: true,
      isConfirmMatched: true,
      isValid: false,
    });
    expect(getPasswordPolicyErrorMessage(state)).toBe(PASSWORD_POLICY_ERROR_MESSAGE);
  });

  it("8자 이상이고 특수문자가 포함되면 정책 조건을 통과한다", () => {
    const state = getPasswordPolicyState("abc1234!", "abc1234!");

    expect(state).toEqual({
      hasMinLength: true,
      hasSpecialChar: true,
      isConfirmMatched: true,
      isValid: true,
    });
    expect(getPasswordPolicyErrorMessage(state)).toBeNull();
  });

  it("underscore를 특수문자로 인정한다", () => {
    const state = getPasswordPolicyState("abc1234_", "abc1234_");

    expect(state.hasSpecialChar).toBe(true);
    expect(state.isValid).toBe(true);
  });

  it("confirm 값이 다르면 불일치 에러를 반환한다", () => {
    const state = getPasswordPolicyState("abc1234!", "abc1234@");

    expect(state.isConfirmMatched).toBe(false);
    expect(state.isValid).toBe(false);
    expect(getPasswordPolicyErrorMessage(state)).toBe(PASSWORD_CONFIRM_MISMATCH_ERROR_MESSAGE);
  });

  it("정책 관련 에러 문구만 정책 에러로 판별한다", () => {
    expect(isPasswordPolicyErrorMessage(PASSWORD_POLICY_ERROR_MESSAGE)).toBe(true);
    expect(isPasswordPolicyErrorMessage(PASSWORD_CONFIRM_MISMATCH_ERROR_MESSAGE)).toBe(true);
    expect(isPasswordPolicyErrorMessage("기타 오류")).toBe(false);
    expect(isPasswordPolicyErrorMessage(null)).toBe(false);
  });
});
