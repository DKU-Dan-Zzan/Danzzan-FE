// 역할: 홈 화면이 한국어/영어 두 언어 모두에서 UI 껍데기 문구를 올바르게 렌더링하는지 스모크 테스트로 검증합니다.
// @vitest-environment jsdom
import { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import Home from "@/routes/home/Home";
import { languageStore } from "@/store/common/languageStore";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockGetHomeImages = vi.fn();
const mockGetEmergencyNotice = vi.fn();
const mockGetLineupImages = vi.fn();
const mockGetPlacementAds = vi.fn();
const mockGetPerformances = vi.fn();

vi.mock("@/api/app/home/homeApi", () => ({
  getHomeImages: (...args: unknown[]) => mockGetHomeImages(...args),
  getEmergencyNotice: (...args: unknown[]) => mockGetEmergencyNotice(...args),
  getLineupImages: (...args: unknown[]) => mockGetLineupImages(...args),
}));

vi.mock("@/api/app/ad/adApi", () => ({
  getPlacementAds: (...args: unknown[]) => mockGetPlacementAds(...args),
}));

vi.mock("@/api/app/timetable/timetableApi", () => ({
  getPerformances: (...args: unknown[]) => mockGetPerformances(...args),
}));

async function renderHome() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  });

  // 중첩된 쿼리(홈 → 현재 공연 섹션)가 모두 정착할 때까지 마이크로태스크를 여러 번 흘려보낸다.
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  return { container, root };
}

describe("Home", () => {
  beforeEach(() => {
    mockGetHomeImages.mockResolvedValue([]);
    mockGetEmergencyNotice.mockResolvedValue(null);
    mockGetLineupImages.mockResolvedValue([]);
    mockGetPlacementAds.mockResolvedValue([]);
    mockGetPerformances.mockResolvedValue({ performances: [] });
  });

  it("한국어에서 진행중인 공연 없음 문구를 보여준다", async () => {
    languageStore.setLanguage("ko");
    const { container, root } = await renderHome();

    expect(container.textContent).toContain("진행중인 공연이 없습니다");
    expect(container.textContent).toContain("타임테이블에서 다음 공연을 확인해보세요");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("영어에서 진행중인 공연 없음 문구를 영문으로 보여준다", async () => {
    languageStore.setLanguage("en");
    const { container, root } = await renderHome();

    expect(container.textContent).toContain("No performance is on right now");
    expect(container.textContent).toContain("Check the timetable for the next performance");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
