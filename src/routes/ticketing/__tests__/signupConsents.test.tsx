// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Signup from "@/routes/ticketing/signup/Signup";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

function renderSignup() {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={["/ticket/signup"]}>
      <Routes>
        <Route path="/ticket/signup" element={<Signup />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ticket signup consents", () => {
  it("회원가입 화면에서 개인정보 제3자 제공 동의 항목을 노출하지 않는다", () => {
    const markup = renderSignup();

    expect(markup).not.toContain("개인정보의 제3자 제공에 대한 동의");
    expect(markup).toContain("개인정보 처리위탁에 대한 동의");
    expect(markup).toContain("필수 수집·이용 동의");
    expect(markup).toContain("마케팅 이용 수집 이용 동의");
    expect(markup).not.toContain("선택 수집·이용 동의 (광고 관련)");
  });

  it("필수 수집·이용 동의 상세에 변경된 개인정보 수집 및 이용 문구를 노출한다", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/ticket/signup"]}>
          <Routes>
            <Route path="/ticket/signup" element={<Signup />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    const consentLabel = Array.from(container.querySelectorAll("label")).find((element) =>
      element.textContent?.includes("필수 수집·이용 동의"),
    );
    expect(consentLabel).not.toBeUndefined();

    const consentRowButtons = consentLabel?.parentElement?.querySelectorAll<HTMLButtonElement>(
      'button[type="button"]',
    );
    const detailButton = consentRowButtons?.item(1);
    expect(detailButton).not.toBeUndefined();

    await act(async () => {
      detailButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("개인정보 수집 및 이용에 관한 동의서");
    expect(container.textContent).toContain("시행일자: 2026년 5월 1일");
    expect(container.textContent).toContain("통계 데이터 등 개인을 특정할 수 없는 데이터를 작성하기 위해");
    expect(container.textContent).toContain("연락처(휴대전화번호), 학적정보(재학·수료·졸업 구분), 소속(전공), 네이버 아이디");
    expect(container.textContent).toContain("회원 탈퇴 시 또는 2026년 12월 31일 중 이른 시점까지 보유·이용");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
