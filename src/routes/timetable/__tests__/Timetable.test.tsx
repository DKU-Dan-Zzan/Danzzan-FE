// 역할: 타임테이블 화면이 한국어/영어 두 언어 모두에서 UI 껍데기 문구를 올바르게 렌더링하는지 스모크 테스트로 검증합니다.
// @vitest-environment jsdom
import { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import Timetable from "@/routes/timetable/Timetable";
import { languageStore } from "@/store/common/languageStore";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockGetPerformances = vi.fn();
const mockGetContentImages = vi.fn();
const mockGetTimetableDisplayConfig = vi.fn();
const mockGetPlacementAds = vi.fn();

vi.mock("@/api/app/timetable/timetableApi", () => ({
  getPerformances: (...args: unknown[]) => mockGetPerformances(...args),
  getContentImages: (...args: unknown[]) => mockGetContentImages(...args),
  getTimetableDisplayConfig: (...args: unknown[]) => mockGetTimetableDisplayConfig(...args),
}));

vi.mock("@/api/app/ad/adApi", () => ({
  getPlacementAds: (...args: unknown[]) => mockGetPlacementAds(...args),
}));

async function renderTimetable() {
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
          <Timetable />
        </MemoryRouter>
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

describe("Timetable", () => {
  beforeEach(() => {
    mockGetPerformances.mockResolvedValue({ date: "2026-09-09", performances: [] });
    mockGetContentImages.mockResolvedValue([]);
    mockGetTimetableDisplayConfig.mockResolvedValue({ comingSoonOverlayEnabled: false });
    mockGetPlacementAds.mockResolvedValue([]);
  });

  it("한국어에서 화면 껍데기 문구를 보여준다", async () => {
    languageStore.setLanguage("ko");
    const { container, root } = await renderTimetable();

    expect(container.textContent).toContain("타임테이블");
    expect(container.textContent).toContain("일정은 현장 상황에 따라 변경될 수 있습니다");
    expect(container.textContent).toContain("등록된 공연이 없습니다.");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("영어에서 화면 껍데기 문구를 영문으로 보여준다", async () => {
    languageStore.setLanguage("en");
    const { container, root } = await renderTimetable();

    expect(container.textContent).toContain("Timetable");
    expect(container.textContent).toContain("Schedule may change based on on-site conditions");
    expect(container.textContent).toContain("No performances scheduled.");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
