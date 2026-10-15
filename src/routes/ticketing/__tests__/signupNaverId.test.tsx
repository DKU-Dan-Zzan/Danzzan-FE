// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Signup from "@/routes/ticketing/signup/Signup";
import { HttpError } from "@/api/ticketing/httpClient";

// Keep Signup and signupApi real; only replace the network boundary.
const client = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@/api/ticketing/httpClient", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/api/ticketing/httpClient")>(),
  createHttpClient: () => client,
}));
vi.mock("@/utils/common/env", () => ({
  env: { apiBaseUrl: "/api" },
  requireEnv: (value: string) => value,
}));

let container: HTMLDivElement;
let root: Root;
const signupUrl = "/user/signup-test-token";
const validPassword = "Test-only!123";

function input(id: string) {
  const element = container.querySelector<HTMLInputElement>(`#${id}`);
  expect(element, `input ${id}`).not.toBeNull();
  return element!;
}

async function fill(id: string, value: string) {
  await act(async () => {
    const element = input(id);
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function submit() {
  await act(async () => {
    container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

async function clickButton(label: string) {
  const button = Array.from(container.querySelectorAll("button")).find((item) => item.textContent?.trim() === label);
  expect(button, `button ${label}`).toBeDefined();
  await act(async () => button!.click());
}

async function reachPhoneStep() {
  await fill("dkuStudentId", "32999999");
  await fill("dkuPassword", "local-test-portal-password");
  await act(async () => {
    container.querySelector<HTMLButtonElement>("#consent-1")!.click();
    container.querySelector<HTMLButtonElement>("#consent-2")!.click();
  });
  await submit();
}

async function reachFinalStep() {
  await reachPhoneStep();
  await fill("phoneNumber", "01000000000");
  await clickButton("문자 인증코드 발급");
  await clickButton("인증 확인");
  await fill("password", validPassword);
  await fill("passwordConfirm", validPassword);
}

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  client.post.mockReset();
  client.post.mockImplementation(async (url: string) => {
    switch (url) {
      case "/user/dku/verify":
        return {
          signupToken: "signup-test-token",
          student: { studentId: "32999999", name: "테스트", college: "테스트대학", major: "테스트학과", academicStatus: "ENROLLED" },
        };
      case "/user/phone-verifications/signup-test-token/sessions":
        return {
          sessionId: "phone-test-session", status: "PENDING", octomoReceiveNumber: "00000000",
          messageBody: "TESTONLY", expiresInSec: 300, statusPollHintSec: 5,
          expiresAt: new Date(Date.now() + 300_000).toISOString(),
        };
      case "/user/phone-verifications/sessions/phone-test-session/verify":
        return {
          sessionId: "phone-test-session", status: "VERIFIED", attemptCount: 1, expiresInSec: 300,
          expiresAt: new Date(Date.now() + 300_000).toISOString(),
          verifiedAt: new Date().toISOString(), verifiedPhoneNumberMasked: "010****0000",
        };
      case signupUrl:
        return undefined;
      default:
        throw new Error(`Unexpected mocked request: ${url}`);
    }
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Signup /></MemoryRouter>);
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("May signup Naver ID restoration", () => {
  it("keeps consent and phone verification before the final Naver ID form", async () => {
    expect(container.querySelector("#naverId")).toBeNull();
    await fill("dkuStudentId", "32999999");
    await fill("dkuPassword", "local-test-portal-password");
    await submit();
    expect(client.post).not.toHaveBeenCalled();

    await reachPhoneStep();
    expect(container.querySelector("#naverId")).toBeNull();
    await fill("phoneNumber", "01000000000");
    await clickButton("문자 인증코드 발급");
    client.post.mockRejectedValueOnce(new HttpError("Not verified", 400, { errorCode: "PHONE_VERIFICATION_MESSAGE_NOT_FOUND" }));
    await clickButton("인증 확인");
    expect(container.querySelector("#naverId")).toBeNull();
    await clickButton("인증 확인");
    expect(input("naverId").required).toBe(true);
    expect(input("naverIdConfirm").required).toBe(true);
    expect(client.post).not.toHaveBeenCalledWith(signupUrl, expect.anything());
  });

  it("sends both trimmed IDs and the verified session through the real signup API", async () => {
    await reachFinalStep();
    await fill("naverId", "  signup_test_id  ");
    await fill("naverIdConfirm", "signup_test_id ");
    await submit();

    expect(client.post).toHaveBeenLastCalledWith(signupUrl, {
      password: validPassword, confirmPassword: validPassword,
      naverId: "signup_test_id", confirmNaverId: "signup_test_id",
      phoneVerificationSessionId: "phone-test-session",
    });
    expect(container.textContent).toContain("회원가입이 완료되었습니다");
  });

  it.each([["", ""], ["   ", "   "], ["signup_test_id", ""]])(
    "blocks empty IDs (%j, %j) even if native form validation is bypassed",
    async (naverId, confirmation) => {
      await reachFinalStep();
      await fill("naverId", naverId);
      await fill("naverIdConfirm", confirmation);
      await submit();
      expect(client.post).not.toHaveBeenCalledWith(signupUrl, expect.anything());
      expect(container.textContent).toContain("네이버 아이디를 입력해 주세요.");
    },
  );

  it("blocks a mismatch and allows correcting it without losing verification", async () => {
    await reachFinalStep();
    await fill("naverId", "signup_test_id");
    await fill("naverIdConfirm", "another_test_id");
    await submit();
    expect(client.post).not.toHaveBeenCalledWith(signupUrl, expect.anything());
    expect(container.textContent).toContain("네이버 아이디가 서로 일치하지 않습니다.");

    await fill("naverIdConfirm", "signup_test_id");
    expect(container.textContent).not.toContain("네이버 아이디가 서로 일치하지 않습니다.");
    await submit();
    expect(client.post).toHaveBeenLastCalledWith(signupUrl, expect.objectContaining({
      naverId: "signup_test_id", confirmNaverId: "signup_test_id", phoneVerificationSessionId: "phone-test-session",
    }));
  });

  it("retains the password policy when the Naver IDs match", async () => {
    await reachFinalStep();
    await fill("naverId", "signup_test_id");
    await fill("naverIdConfirm", "signup_test_id");
    await fill("password", "weak");
    await fill("passwordConfirm", "weak");
    await submit();
    expect(client.post).not.toHaveBeenCalledWith(signupUrl, expect.anything());
    expect(container.textContent).not.toContain("회원가입이 완료되었습니다");
  });

  it("keeps the final form and IDs available for retry after a server error", async () => {
    await reachFinalStep();
    await fill("naverId", "signup_test_id");
    await fill("naverIdConfirm", "signup_test_id");
    client.post.mockRejectedValueOnce(new HttpError("Signup failed", 500, { error: "테스트 서버 오류" }));
    await submit();
    expect(container.textContent).toContain("테스트 서버 오류");
    expect(container.textContent).not.toContain("회원가입이 완료되었습니다");
    expect(input("naverId").value).toBe("signup_test_id");
    expect(input("naverId").disabled).toBe(false);
    await submit();
    expect(container.textContent).toContain("회원가입이 완료되었습니다");
  });
});
