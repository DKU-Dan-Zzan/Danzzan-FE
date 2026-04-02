// 역할: 티켓팅 로그인 화면의 비밀번호 가시성 토글 동작을 검증합니다.
// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Login from "@/routes/ticketing/login/Login";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/hooks/ticketing/useAuth", () => ({
  useAuth: () => ({
    login: vi.fn(async () => undefined),
  }),
}));

describe("ticketing login password toggle", () => {
  it("비밀번호 보기/숨기기 버튼 클릭 시 input 타입이 전환된다", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/ticket/login"]}>
          <Routes>
            <Route path="/ticket/login" element={<Login />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    const passwordInput = container.querySelector<HTMLInputElement>("#password");
    expect(passwordInput).not.toBeNull();
    expect(passwordInput?.type).toBe("password");
    expect(container.querySelector("svg.lucide-eye-off")).not.toBeNull();
    expect(container.querySelector("svg.lucide-eye")).toBeNull();

    const showButton = container.querySelector<HTMLButtonElement>('button[aria-label="비밀번호 보기"]');
    expect(showButton).not.toBeNull();

    await act(async () => {
      showButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const hideButton = container.querySelector<HTMLButtonElement>('button[aria-label="비밀번호 숨기기"]');
    expect(hideButton).not.toBeNull();
    expect(passwordInput?.type).toBe("text");
    expect(container.querySelector("svg.lucide-eye")).not.toBeNull();
    expect(container.querySelector("svg.lucide-eye-off")).toBeNull();

    await act(async () => {
      hideButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.querySelector('button[aria-label="비밀번호 보기"]')).not.toBeNull();
    expect(passwordInput?.type).toBe("password");
    expect(container.querySelector("svg.lucide-eye-off")).not.toBeNull();
    expect(container.querySelector("svg.lucide-eye")).toBeNull();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
