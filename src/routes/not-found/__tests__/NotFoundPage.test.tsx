// 역할: 공통 404 화면의 핵심 문구와 복구 액션 렌더링을 스모크 테스트로 검증합니다.
// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import NotFoundPage from "@/routes/not-found/NotFoundPage";

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
  it("일반 앱 경로에서는 축제 톤 문구와 부스맵 복구 액션을 렌더링한다", async () => {
    const { container, root } = await renderNotFound("/missing-festival-path");

    expect(container.textContent).toContain("DANFESTA / 404");
    expect(container.textContent).toContain("축제길을 잠깐 놓쳤어요");
    expect(container.querySelector('img[src="/DAN-ZZAN.png"]')).not.toBeNull();
    expect(container.querySelector('a[href="/"]')).not.toBeNull();
    expect(container.querySelector('a[href="/map"]')).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("티켓팅 경로에서는 티켓팅 복구 액션을 우선 노출한다", async () => {
    const { container, root } = await renderNotFound("/ticket/missing-ticket-path");

    expect(container.querySelector('a[href="/ticket/ticketing"]')).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
