// 역할: 부스맵 화면이 한국어/영어 두 언어 모두에서 UI 껍데기 문구를 올바르게 렌더링하는지 스모크 테스트로 검증합니다.
// @vitest-environment jsdom
import { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import BoothMap from "@/routes/boothmap/BoothMap";
import { languageStore } from "@/store/common/languageStore";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockGetBoothMap = vi.fn();
const mockGetPubs = vi.fn();
const mockGetBoothSummary = vi.fn();

vi.mock("@/hooks/app/boothmap/useKakaoMapLoader", () => ({
  default: () => ({
    isLoaded: false,
    isError: false,
  }),
}));

vi.mock("@/api/app/boothmap/boothmapApi", () => ({
  getBoothMap: (...args: unknown[]) => mockGetBoothMap(...args),
  getPubs: (...args: unknown[]) => mockGetPubs(...args),
  getBoothSummary: (...args: unknown[]) => mockGetBoothSummary(...args),
}));

async function renderBoothMap() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <BoothMap />
      </QueryClientProvider>,
    );
  });

  return { container, root };
}

describe("BoothMap", () => {
  beforeEach(() => {
    // 데이터 쿼리를 영구 pending 상태로 유지해 로딩 껍데기 문구만 검증한다.
    mockGetBoothMap.mockReturnValue(new Promise(() => {}));
    mockGetPubs.mockReturnValue(new Promise(() => {}));
    mockGetBoothSummary.mockReturnValue(new Promise(() => {}));
  });

  it("한국어에서 로딩 문구를 보여준다", async () => {
    languageStore.setLanguage("ko");
    const { container, root } = await renderBoothMap();

    expect(container.textContent).toContain("부스맵을 불러오는 중...");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("영어에서 로딩 문구를 영문으로 보여준다", async () => {
    languageStore.setLanguage("en");
    const { container, root } = await renderBoothMap();

    expect(container.textContent).toContain("Loading the booth map...");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
