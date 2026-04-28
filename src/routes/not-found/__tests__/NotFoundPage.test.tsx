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
  it("축제 톤 문구와 홈 복구 액션만 렌더링한다", async () => {
    const { container, root } = await renderNotFound("/missing-festival-path");

    expect(container.textContent).toContain("DANFESTA / 404");
    expect(container.textContent).toContain("축제길을 잠깐 놓쳤어요");
    expect(container.textContent).toContain("홈에서 축제 정보를 다시 찾아볼 수 있어요.");
    expect(container.querySelector('img[src="/DAN-ZZAN.png"]')).not.toBeNull();
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
    expect(container.querySelectorAll("a")).toHaveLength(1);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
