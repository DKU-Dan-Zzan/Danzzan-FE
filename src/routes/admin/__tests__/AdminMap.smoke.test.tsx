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
  updateBoothLocation: vi.fn(async () => undefined),
  updateCollegeLocation: vi.fn(async () => undefined),
}));

describe("AdminMap smoke", () => {
  beforeEach(() => {
    mockGetAdminMap.mockResolvedValue({
      colleges: [],
      booths: [],
    });
  });

  it("지도 편집 기본 UI를 렌더링한다", async () => {
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
    expect(container.textContent).toContain("현재 운영 일차");
    expect(container.textContent).toContain("지도 편집 영역");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
