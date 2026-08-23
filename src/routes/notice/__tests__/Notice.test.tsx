// 역할: 공지 화면이 한국어/영어 두 언어 모두에서 UI 껍데기 문구를 올바르게 렌더링하는지 스모크 테스트로 검증합니다.
// @vitest-environment jsdom
import { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import Notice from "@/routes/notice/Notice";
import { languageStore } from "@/store/common/languageStore";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockGetNotices = vi.fn();
const mockGetNoticeDetail = vi.fn();
const mockGetPlacementAds = vi.fn();

vi.mock("@/api/app/notice/noticeApi", () => ({
  getNotices: (...args: unknown[]) => mockGetNotices(...args),
  getNoticeDetail: (...args: unknown[]) => mockGetNoticeDetail(...args),
}));

vi.mock("@/api/app/ad/adApi", () => ({
  getPlacementAds: (...args: unknown[]) => mockGetPlacementAds(...args),
}));

async function renderNotice() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <Notice />
      </QueryClientProvider>,
    );
  });

  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  return { container, root };
}

describe("Notice", () => {
  beforeEach(() => {
    mockGetNotices.mockResolvedValue({
      content: [],
      number: 0,
      totalPages: 0,
    });
    mockGetNoticeDetail.mockResolvedValue(null);
    mockGetPlacementAds.mockResolvedValue([]);
  });

  it("한국어에서 화면 껍데기 문구를 보여준다", async () => {
    languageStore.setLanguage("ko");
    const { container, root } = await renderNotice();

    expect(container.textContent).toContain("공지사항");
    expect(container.textContent).toContain("아직 등록된 공지사항이 없습니다.");
    expect(
      container.querySelector('input[placeholder="공지 제목 또는 내용을 검색해 보세요"]'),
    ).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("영어에서 화면 껍데기 문구를 영문으로 보여준다", async () => {
    languageStore.setLanguage("en");
    const { container, root } = await renderNotice();

    expect(container.textContent).toContain("Notices");
    expect(container.textContent).toContain("No notices yet.");
    expect(
      container.querySelector('input[placeholder="Search notice titles or content"]'),
    ).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
