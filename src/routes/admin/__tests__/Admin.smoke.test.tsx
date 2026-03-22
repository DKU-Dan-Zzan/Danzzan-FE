// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import Admin from "@/routes/admin/Admin";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockLogout = vi.fn();

vi.mock("@/hooks/app/admin/useAdminAuth", () => ({
  useAdminAuth: () => ({
    logout: mockLogout,
  }),
}));

vi.mock("@/hooks/app/admin/useAdminNotices", () => ({
  useAdminNotices: () => ({
    noticeKeyword: "",
    setNoticeKeyword: vi.fn(),
    noticePage: 0,
    noticeTotalPages: 1,
    notices: [],
    noticeLoading: false,
    noticeStatus: "ACTIVE",
    setNoticeStatus: vi.fn(),
    reloadNotices: vi.fn(async () => undefined),
  }),
}));

vi.mock("@/hooks/app/admin/useAdminAds", () => ({
  useAdminAds: () => ({
    adLoading: false,
    homeBottomAd: null,
    myTicketAd: null,
    reloadAds: vi.fn(async () => undefined),
  }),
}));

vi.mock("@/routes/admin/hooks/useEmergencyNotice", () => ({
  useEmergencyNotice: () => ({
    emergencyMessage: "",
    setEmergencyMessage: vi.fn(),
    emergencyActive: true,
    setEmergencyActive: vi.fn(),
    emergencyLoading: false,
    handleSaveEmergency: vi.fn(async () => undefined),
  }),
}));

vi.mock("@/routes/admin/hooks/useAdminNoticeActions", () => ({
  useAdminNoticeActions: () => ({
    editingNotice: null,
    setEditingNotice: vi.fn(),
    noticePinned: [],
    noticeOthers: [],
    effectivePinned: [],
    pinReorderMode: false,
    pinSaving: false,
    noticeImageUploading: false,
    openNewNotice: vi.fn(),
    openEditNotice: vi.fn(),
    handleSubmitNotice: vi.fn(),
    handleUploadNoticeImages: vi.fn(),
    handleArchiveNotice: vi.fn(),
    handleRestoreNotice: vi.fn(),
    startPinReorder: vi.fn(),
    cancelPinReorder: vi.fn(),
    movePinnedItem: vi.fn(),
    handleSavePinOrder: vi.fn(async () => undefined),
  }),
}));

vi.mock("@/routes/admin/hooks/useAdminAdActions", () => ({
  useAdminAdActions: () => ({
    editingAd: null,
    setEditingAd: vi.fn(),
    adImageUploading: false,
    openAdEditor: vi.fn(),
    handleDeleteAd: vi.fn(async () => undefined),
    handleSubmitAd: vi.fn(),
    handleUploadAdImage: vi.fn(),
  }),
}));

describe("Admin smoke", () => {
  it("핵심 관리자 섹션을 렌더링한다", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter>
          <Admin />
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain("긴급 공지");
    expect(container.textContent).toContain("일반 공지 목록");
    expect(container.textContent).toContain("광고 배너 관리");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
