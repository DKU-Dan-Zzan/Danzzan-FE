// 역할: AdminMap 화면의 기본 데이터 로드와 탭 구조 렌더링을 스모크 테스트로 검증한다.
// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import AdminMap from "@/routes/admin/AdminMap";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockGetAdminMap = vi.fn();

vi.mock("@/hooks/app/boothmap/useKakaoMapLoader", () => ({
  default: () => ({
    isLoaded: false,
  }),
}));

vi.mock("@/api/app/admin/adminMapApi", () => ({
  clearBoothLocation: vi.fn(async () => undefined),
  getAdminMap: (...args: unknown[]) => mockGetAdminMap(...args),
  updateComingSoonOverlayEnabled: vi.fn(async () => undefined),
  updateBoothLocation: vi.fn(async () => undefined),
  updateCollegeLocation: vi.fn(async () => undefined),
}));

describe("AdminMap smoke", () => {
  beforeEach(() => {
    mockGetAdminMap.mockResolvedValue({
      colleges: [],
      booths: [],
      comingSoonOverlayEnabled: false,
    });
  });

  it("개발자 전용 관리자 페이지의 기본 Map 탭 UI를 렌더링한다", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter>
          <AdminMap />
        </MemoryRouter>,
      );
    });

    expect(mockGetAdminMap).toHaveBeenCalled();
    expect(container.textContent).toContain("개발자 전용 관리자 페이지");
    expect(container.textContent).toContain("Map");
    expect(container.textContent).toContain("Booth");
    expect(container.textContent).toContain("현재 운영 일");
    expect(container.textContent).toContain("지도 편집 영역");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
