// 역할: 공통 404 화면의 핵심 문구와 복구 액션 렌더링을 한국어/영어 모두에서 스모크 테스트로 검증합니다.
// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { beforeEach } from "vitest";
import NotFoundPage from "@/routes/not-found/NotFoundPage";
import { languageStore } from "@/store/common/languageStore";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

async function renderNotFound(pathname: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[pathname]}>
        <NotFoundPage />
      </MemoryRouter>,
    );
  });

  return { container, root };
}

describe("Common NotFoundPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    languageStore.setLanguage("ko");
  });

  it("브랜드 워터마크와 차분한 404 문구, 홈 복구 액션만 렌더링한다", async () => {
    const { container, root } = await renderNotFound("/missing-festival-path");

    expect(container.textContent).toContain("404");
    expect(container.textContent).toContain("페이지를 찾을 수 없어요");
    expect(container.textContent).toContain("주소가 바뀌었거나 접근할 수 없는 페이지예요.");
    expect(container.textContent).not.toContain("축제길");
    expect(container.textContent).not.toContain("LOST GATE");
    expect(container.textContent).not.toContain("NO ROUTE");
    expect(container.textContent).not.toContain("FESTIVAL PASS");
    expect(container.querySelector('img[src="/DAN-ZZAN.png"][aria-hidden="true"]')).not.toBeNull();
    expect(container.querySelector('a[href="/"]')).not.toBeNull();
    expect(container.querySelectorAll("a")).toHaveLength(1);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("티켓팅 경로에서도 별도 보조 액션 없이 홈 복구 액션만 렌더링한다", async () => {
    const { container, root } = await renderNotFound("/ticket/missing-ticket-path");

    expect(container.querySelector('a[href="/"]')).not.toBeNull();
    expect(container.querySelector('a[href="/ticket/ticketing"]')).toBeNull();
    expect(container.querySelector('a[href="/map"]')).toBeNull();
    expect(container.querySelectorAll("a")).toHaveLength(1);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("영어 문구를 보여준다", async () => {
    languageStore.setLanguage("en");

    const { container, root } = await renderNotFound("/missing-festival-path");

    expect(container.textContent).toContain("Page not found");
    expect(container.textContent).toContain("This address may have changed or is unavailable.");
    expect(container.textContent).toContain("Go home");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
