import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Bell,
  LogOut,
  Megaphone,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  UploadCloud,
  Map,
} from "lucide-react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import {
  createAdminNotice,
  deleteAdminNotice,
  restoreAdminNotice,
  getNoticeImagePresign,
  getAdminAdImageUpload,
  getAdminNotices,
  getEmergencyAdminNotice,
  setAdminAdsActiveByPlacement,
  type AdvertisementPlacement,
  type NoticeStatusFilter,
  type NoticeResponse,
  createAdminAd,
  updateAdminNotice,
  updateNoticeDisplayOrder,
  updateEmergencyAdminNotice,
} from "../../api/admin";
import { getPlacementAd, type ClientAdDto } from "../../api/noticeApi";
import { AdminShell } from "@/components/layout/AdminShell";

type NoticeAuthor = "개발팀" | "총학생회";

type NoticeFormState = {
  id?: number;
  title: string;
  content: string;
  author: NoticeAuthor;
  isPinned: boolean;
  thumbnailImageUrl: string;
  images: string[];
};

type AdFormState = {
  id?: number;
  title: string;
  imageUrl: string;
  placement: AdvertisementPlacement;
};

function formatDate(dateString: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function Admin() {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const [globalError, setGlobalError] = useState<string | null>(null);

  // 긴급 공지
  const [emergencyMessage, setEmergencyMessage] = useState("");
  const [emergencyActive, setEmergencyActive] = useState(true);
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  // 일반 공지
  const [noticeKeyword, setNoticeKeyword] = useState("");
  const [noticePage, setNoticePage] = useState(0);
  const [noticeTotalPages, setNoticeTotalPages] = useState(0);
  const [notices, setNotices] = useState<NoticeResponse[]>([]);
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeFormState | null>(null);
  const [noticeStatus, setNoticeStatus] = useState<NoticeStatusFilter>("ACTIVE");
  const [pinReorderMode, setPinReorderMode] = useState(false);
  const [pinReorderList, setPinReorderList] = useState<NoticeResponse[]>([]);
  const [pinSaving, setPinSaving] = useState(false);
  // 광고
  const [adLoading, setAdLoading] = useState(false);
  const [editingAd, setEditingAd] = useState<AdFormState | null>(null);

  const [homeBottomAd, setHomeBottomAd] = useState<ClientAdDto | null>(null);
  const [myTicketAd, setMyTicketAd] = useState<ClientAdDto | null>(null);

  const [initialLoaded, setInitialLoaded] = useState(false);
  const [noticeImageUploading, setNoticeImageUploading] = useState(false);
  const [adImageUploading, setAdImageUploading] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  // 초기 로딩
  useEffect(() => {
    const loadInitial = async () => {
      try {
        setGlobalError(null);
        setEmergencyLoading(true);
        setNoticeLoading(true);

        const [emergencyRes, noticePageRes] = await Promise.all([
          getEmergencyAdminNotice(),
          getAdminNotices({ page: 0, size: 10, status: "ACTIVE" }),
        ]);

        setEmergencyMessage(emergencyRes.message ?? "");
        setEmergencyActive(Boolean(emergencyRes.isActive));

        setNotices(noticePageRes.content);
        setNoticePage(noticePageRes.number);
        setNoticeTotalPages(noticePageRes.totalPages);

        // 광고는 위치별 최신 1개만 조회
        try {
          const [homeBottom, myTicket] = await Promise.all([
            getPlacementAd("HOME_BOTTOM"),
            getPlacementAd("MY_TICKET"),
          ]);
          setHomeBottomAd(homeBottom);
          setMyTicketAd(myTicket);
        } catch (error) {
          // 광고 조회 실패는 전체 에러로 올리지 않고 조용히 무시
          console.error(error);
        } finally {
          setAdLoading(false);
        }
      } catch (error) {
        setGlobalError(error instanceof Error ? error.message : "데이터를 불러오지 못했습니다.");
      } finally {
        setEmergencyLoading(false);
        setNoticeLoading(false);
        setInitialLoaded(true);
      }
    };

    if (!initialLoaded) {
      void loadInitial();
    }
  }, [initialLoaded]);

  // 공지 재조회
  const reloadNotices = async (
    page = 0,
    keyword = noticeKeyword,
    status: NoticeStatusFilter = noticeStatus,
  ) => {
    try {
      setGlobalError(null);
      setNoticeLoading(true);
      const res = await getAdminNotices({
        page,
        size: 10,
        keyword: keyword.trim() || undefined,
        status,
      });
      setNotices(res.content);
      setNoticePage(res.number);
      setNoticeTotalPages(res.totalPages);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "공지 목록을 불러오지 못했습니다.");
    } finally {
      setNoticeLoading(false);
    }
  };

  // 광고 재조회
  const reloadAds = async () => {
    try {
      setAdLoading(true);
      const [homeBottom, myTicket] = await Promise.all([
        getPlacementAd("HOME_BOTTOM"),
        getPlacementAd("MY_TICKET"),
      ]);
      setHomeBottomAd(homeBottom);
      setMyTicketAd(myTicket);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "광고 정보를 불러오지 못했습니다.");
    } finally {
      setAdLoading(false);
    }
  };

  const handleDeleteAd = async (placement: AdvertisementPlacement) => {
    const ad = placement === "HOME_BOTTOM" ? homeBottomAd : myTicketAd;
    if (!ad) return;

    const confirmed = window.confirm("이 광고를 삭제하시겠습니까?");
    if (!confirmed) return;

    try {
      setGlobalError(null);
      await setAdminAdsActiveByPlacement(placement, false);
      await reloadAds();
      window.alert("삭제되었습니다.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "광고 삭제에 실패했습니다.";
      setGlobalError(message);
      window.alert(message);
    }
  };

  // 긴급 공지 저장
  const handleSaveEmergency = async () => {
    try {
      setGlobalError(null);
      setEmergencyLoading(true);
      await updateEmergencyAdminNotice({
        message: emergencyMessage.trim() || undefined,
        isActive: emergencyActive,
      });
      window.alert("변경 완료했습니다.");
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "긴급 공지를 저장하지 못했습니다.");
    } finally {
      setEmergencyLoading(false);
    }
  };

  const noticePinned = useMemo(
    () =>
      noticeStatus === "DELETED"
        ? []
        : notices.filter((n) => (n.isPinned ?? n.isEmergency) === true),
    [notices, noticeStatus],
  );
  const noticeOthers = useMemo(
    () =>
      noticeStatus === "DELETED"
        ? notices
        : notices.filter((n) => !(n.isPinned ?? n.isEmergency)),
    [notices, noticeStatus],
  );

  const effectivePinned = pinReorderMode ? pinReorderList : noticePinned;

  const openNewNotice = () => {
    setEditingNotice({
      title: "",
      content: "",
      author: "개발팀",
      isPinned: false,
      thumbnailImageUrl: "",
      images: [],
    });
  };

  const openEditNotice = (notice: NoticeResponse) => {
    setEditingNotice({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      author: (notice.author as NoticeAuthor) || "개발팀",
      isPinned: Boolean(notice.isPinned ?? notice.isEmergency),
      thumbnailImageUrl: notice.thumbnailImageUrl ?? "",
      images: notice.imageUrls ?? [],
    });
  };

  const handleSubmitNotice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingNotice) return;

    const payload = {
      title: editingNotice.title.trim(),
      content: editingNotice.content.trim(),
      author: editingNotice.author,
      isPinned: editingNotice.isPinned,
      thumbnailImageUrl: editingNotice.thumbnailImageUrl.trim() || null,
      images: editingNotice.images,
    };

    if (!payload.title || !payload.content) {
      setGlobalError("제목과 내용을 모두 입력해 주세요.");
      return;
    }

    try {
      setGlobalError(null);
      if (editingNotice.id) {
        await updateAdminNotice(editingNotice.id, payload);
      } else {
        await createAdminNotice(payload);
      }
      setEditingNotice(null);
      await reloadNotices(noticePage);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "공지를 저장하지 못했습니다.");
    }
  };

  const handleUploadNoticeImages = async (files: FileList) => {
    if (!editingNotice) return;

    const currentCount = editingNotice.images.length;
    const incomingFiles = Array.from(files);
    const remainingSlots = 10 - currentCount;

    if (remainingSlots <= 0) {
      window.alert("이미지는 최대 10개까지 업로드할 수 있습니다.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const limitedFiles = incomingFiles.slice(0, remainingSlots);

    try {
      setNoticeImageUploading(true);

      for (const file of limitedFiles) {
        if (!allowedTypes.includes(file.type)) {
          window.alert("이미지는 JPG, JPEG, PNG, WEBP 형식만 업로드할 수 있습니다.");
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          window.alert(`"${file.name}" 파일이 5MB를 초과하여 업로드할 수 없습니다.`);
          continue;
        }

        const presign = await getNoticeImagePresign({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        });

        if (import.meta.env.DEV) {
          // presign 응답 구조 디버깅용
          console.log("[notice presign]", presign);
        }

        if (!presign.presignedUrl) {
          console.error("[notice presign] presignedUrl is undefined", presign);
          throw new Error("presignedUrl이 비어 있습니다. presign API 응답을 확인해 주세요.");
        }

        const putRes = await fetch(presign.presignedUrl, {
          method: presign.method,
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!putRes.ok) {
          const errorText = await putRes.text().catch(() => "");
          const message = [
            `S3 업로드 실패: ${putRes.status} ${putRes.statusText}`,
            errorText ? `응답: ${errorText}` : "",
          ]
            .filter(Boolean)
            .join("\n");
          throw new Error(message);
        }

        const url = presign.imageUrl ?? presign.fileUrl;
        setEditingNotice((prev) => (prev ? { ...prev, images: [...prev.images, url] } : prev));
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.";
      setGlobalError(message);
      window.alert(message);
    } finally {
      setNoticeImageUploading(false);
    }
  };

  const handleArchiveNotice = async (id: number) => {
    const confirmed = window.confirm("이 공지를 보관 처리하시겠습니까?");
    if (!confirmed) return;

    try {
      setGlobalError(null);
      await deleteAdminNotice(id);
      await reloadNotices(noticePage);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "공지를 보관하지 못했습니다.");
    }
  };

  const handleRestoreNotice = async (id: number) => {
    const confirmed = window.confirm("이 공지를 다시 게시중 상태로 복원할까요?");
    if (!confirmed) return;

    try {
      setGlobalError(null);
      await restoreAdminNotice(id);
      await reloadNotices(noticePage);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "공지를 복원하지 못했습니다.");
    }
  };

  const startPinReorder = () => {
    if (noticePinned.length === 0) {
      window.alert("핀 공지가 없습니다.");
      return;
    }
    setPinReorderList(noticePinned);
    setPinReorderMode(true);
  };

  const cancelPinReorder = () => {
    setPinReorderMode(false);
    setPinReorderList([]);
  };

  const movePinnedItem = (index: number, direction: "up" | "down") => {
    setPinReorderList((prev) => {
      const next = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleSavePinOrder = async () => {
    if (pinReorderList.length === 0) {
      setPinReorderMode(false);
      return;
    }

    try {
      setPinSaving(true);
      await updateNoticeDisplayOrder({
        orders: pinReorderList.map((notice, index) => ({
          id: notice.id,
          displayOrder: index + 1,
        })),
      });
      setPinReorderMode(false);
      setPinReorderList([]);
      await reloadNotices(noticePage);
      window.alert("핀 공지 순서를 저장했습니다.");
    } catch (error) {
      setGlobalError(
        error instanceof Error ? error.message : "핀 공지 순서를 저장하지 못했습니다.",
      );
    } finally {
      setPinSaving(false);
    }
  };

  const handleSubmitAd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingAd) return;

    const payload = {
      title: editingAd.title.trim(),
      imageUrl: editingAd.imageUrl.trim(),
      placement: editingAd.placement,
    };

    if (!payload.title || !payload.imageUrl) {
      setGlobalError("제목과 이미지를 모두 입력해 주세요.");
      return;
    }

    try {
      setGlobalError(null);
      await createAdminAd(payload);
      setEditingAd(null);
      await reloadAds();
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "광고를 저장하지 못했습니다.");
    }
  };

  const handleUploadAdImage = async (file: File) => {
    if (!editingAd) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSizeBytes = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      window.alert("이미지는 JPG, JPEG, PNG, WEBP 형식만 업로드할 수 있습니다.");
      return;
    }

    if (file.size > maxSizeBytes) {
      window.alert("이미지 크기는 최대 5MB까지 업로드할 수 있습니다.");
      return;
    }

    try {
      setAdImageUploading(true);
      setGlobalError(null);

      const uploadMeta = await getAdminAdImageUpload({
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      });

      const putRes = await fetch(uploadMeta.presignedUrl, {
        method: uploadMeta.method,
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!putRes.ok) {
        const errorText = await putRes.text().catch(() => "");
        const message = [
          `광고 이미지 업로드 실패: ${putRes.status} ${putRes.statusText}`,
          errorText ? `응답: ${errorText}` : "",
        ]
          .filter(Boolean)
          .join("\n");
        throw new Error(message);
      }

      setEditingAd((prev) => (prev ? { ...prev, imageUrl: uploadMeta.imageUrl } : prev));
      window.alert("이미지 업로드가 완료되었습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.";
      setGlobalError(message);
      window.alert(message);
    } finally {
      setAdImageUploading(false);
    }
  };

  return (
    <>
      <AdminShell
        title="공지 및 광고 관리자 페이지"
        headerClassName="sticky top-0 z-20 border-b border-[var(--border-base)] bg-[var(--admin-header-bg)]"
        mainClassName="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5"
        actions={
          <>
            <span className="rounded-full border border-[var(--border-base)] bg-[var(--surface-subtle)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
              운영자: 관리자
            </span>

            <button
              type="button"
              onClick={() => navigate("/admin/map")}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[var(--border-base)] bg-white px-3 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-subtle)]"
            >
              <Map className="h-4 w-4" strokeWidth={2.3} />
              지도 편집
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[var(--border-base)] bg-white px-3 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-subtle)]"
            >
              <LogOut className="h-4 w-4" strokeWidth={2.3} />
              로그아웃
            </button>
          </>
        }
      >
        {globalError && (
          <div className="flex items-start gap-2 rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-text)]">
            <AlertCircle className="mt-0.5 h-4 w-4" strokeWidth={2.3} />
            <p>{globalError}</p>
          </div>
        )}

        {/* 긴급 공지 */}
        <section className="rounded-2xl border border-red-100 bg-red-50/60 p-4 shadow-sm">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-red-500" strokeWidth={2.3} />
              <h2 className="text-sm font-bold text-red-600">긴급 공지</h2>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-red-600">
              <span>사용 여부</span>
              <button
                type="button"
                onClick={() => setEmergencyActive((prev) => !prev)}
                className={`inline-flex h-6 items-center rounded-full px-2 text-[11px] font-semibold transition-colors ${
                  emergencyActive
                    ? "bg-red-500 text-white"
                    : "bg-red-100 text-red-500"
                }`}
              >
                {emergencyActive ? "ON" : "OFF"}
              </button>
            </label>
          </header>
          <div className="space-y-3">
            <textarea
              rows={2}
              value={emergencyMessage}
              onChange={(e) => setEmergencyMessage(e.target.value)}
              placeholder="홈 화면 상단에 노출될 한 줄 메시지를 입력해 주세요."
              className="w-full resize-none rounded-2xl border border-red-100 bg-white/80 px-3 py-2 text-sm text-[var(--text)] placeholder:text-red-300 shadow-inner focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <div className="flex items-center justify-between text-[11px] text-red-500">
              <span>※ 한 줄 공지는 단 한 개만 사용됩니다.</span>
              <button
                type="button"
                disabled={emergencyLoading}
                onClick={() => void handleSaveEmergency()}
                className="inline-flex items-center gap-1 rounded-2xl bg-red-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
              >
                <Bell className="h-3.5 w-3.5" strokeWidth={2.4} />
                {emergencyLoading ? "저장 중..." : "긴급 공지 저장"}
              </button>
            </div>
          </div>
        </section>

        {/* 일반 공지 목록 */}
        <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--text)]">일반 공지 목록</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                핀 공지 순서와 삭제된 공지를 함께 관리할 수 있습니다.
              </p>
              <div className="mt-2 flex flex-wrap gap-1 text-[11px] font-semibold">
                {([
                  { key: "ACTIVE", label: "게시중" },
                  { key: "DELETED", label: "보관됨" },
                  { key: "ALL", label: "전체보기" },
                ] satisfies { key: NoticeStatusFilter; label: string }[]).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setNoticeStatus(item.key);
                      void reloadNotices(0, noticeKeyword, item.key);
                    }}
                    className={`rounded-full px-3 py-1 ${
                      noticeStatus === item.key
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--surface-subtle)] text-[var(--text-muted)]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={noticeKeyword}
                onChange={(e) => setNoticeKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void reloadNotices(0, noticeKeyword);
                  }
                }}
                placeholder="제목으로 검색"
                className="h-9 w-40 rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-xs placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
              />
              <button
                type="button"
                onClick={() => void reloadNotices(0, noticeKeyword)}
                className="h-9 rounded-2xl bg-[var(--accent)] px-3 text-xs font-semibold text-white shadow-sm hover:brightness-95"
              >
                검색
              </button>
              <button
                type="button"
                disabled={noticeStatus !== "ACTIVE"}
                onClick={pinReorderMode ? cancelPinReorder : startPinReorder}
                className={`flex h-9 items-center gap-1 rounded-2xl border px-3 text-xs font-semibold ${
                  noticeStatus !== "ACTIVE"
                    ? "cursor-not-allowed border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text-muted)] opacity-60"
                    : pinReorderMode
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text)] hover:bg-[var(--border-base)]"
                }`}
              >
                {pinReorderMode ? "핀 순서 변경 취소" : "핀 공지 순서변경"}
              </button>
              <button
                type="button"
                onClick={openNewNotice}
                className="flex h-9 items-center gap-1 rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-xs font-semibold text-[var(--text)] hover:bg-[var(--border-base)]"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.3} />
                새 공지
              </button>
            </div>
          </header>

          <div className="overflow-hidden rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)]">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2 font-semibold">제목 / 썸네일</th>
                  <th className="px-4 py-2 font-semibold">작성자</th>
                  <th className="px-4 py-2 font-semibold">날짜</th>
                  <th className="px-3 py-2 text-center font-semibold">
                    {noticeStatus === "ALL" ? "상태" : pinReorderMode ? "순서" : "수정"}
                  </th>
                  <th className="px-3 py-2 text-center font-semibold">
                    {noticeStatus === "DELETED" ? "복원" : "보관"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-base)] bg-white">
                {noticeLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-[var(--text-muted)]">
                      공지 목록을 불러오는 중입니다...
                    </td>
                  </tr>
                )}
                {!noticeLoading && noticePinned.length === 0 && noticeOthers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-[var(--text-muted)]">
                      등록된 공지가 없습니다.
                    </td>
                  </tr>
                )}
                {effectivePinned.map((notice, index) => (
                  <tr key={notice.id} className="bg-orange-50/60">
                    <td className="px-4 py-2 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                          <span>📌</span>
                          <span>상단 고정</span>
                        </span>
                        {notice.thumbnailImageUrl && (
                          <img
                            src={notice.thumbnailImageUrl}
                            alt={notice.title}
                            className="h-8 w-8 flex-shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <span className="truncate text-sm font-semibold text-[var(--text)]">
                          {notice.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">{notice.author}</td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">
                      {formatDate(notice.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {noticeStatus === "ALL" ? (
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            notice.isActive === false
                              ? "bg-slate-100 text-slate-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {notice.isActive === false ? "보관됨" : "게시중"}
                        </span>
                      ) : pinReorderMode ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => movePinnedItem(index, "up")}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] disabled:opacity-40"
                          >
                            <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.3} />
                          </button>
                          <button
                            type="button"
                            disabled={index === effectivePinned.length - 1}
                            onClick={() => movePinnedItem(index, "down")}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] disabled:opacity-40"
                          >
                            <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.3} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openEditNotice(notice)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:bg-[var(--border-base)]"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={2.3} />
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {noticeStatus === "DELETED" ? (
                        <button
                          type="button"
                          onClick={() => void handleRestoreNotice(notice.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        >
                          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.3} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleArchiveNotice(notice.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {noticeOthers.map((notice) => (
                  <tr key={notice.id}>
                    <td className="px-4 py-2 align-middle">
                      <div className="flex items-center gap-2">
                        {notice.thumbnailImageUrl && (
                          <img
                            src={notice.thumbnailImageUrl}
                            alt={notice.title}
                            className="h-8 w-8 flex-shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <span className="truncate text-sm text-[var(--text)]">{notice.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">{notice.author}</td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">
                      {formatDate(notice.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {pinReorderMode ? (
                        <span className="text-[11px] text-[var(--text-muted)]">-</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openEditNotice(notice)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:bg-[var(--border-base)]"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={2.3} />
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {noticeStatus === "DELETED" ? (
                        <button
                          type="button"
                          onClick={() => void handleRestoreNotice(notice.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        >
                          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.3} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleArchiveNotice(notice.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {noticeTotalPages > 1 && (
            <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-[var(--text-muted)]">
              <button
                type="button"
                disabled={noticePage === 0}
                onClick={() => void reloadNotices(noticePage - 1)}
                className="rounded-full border border-[var(--border-base)] bg-[var(--surface-subtle)] px-2 py-1 disabled:opacity-50"
              >
                이전
              </button>
              <span>
                {noticePage + 1} / {noticeTotalPages}
              </span>
              <button
                type="button"
                disabled={noticePage + 1 >= noticeTotalPages}
                onClick={() => void reloadNotices(noticePage + 1)}
                className="rounded-full border border-[var(--border-base)] bg-[var(--surface-subtle)] px-2 py-1 disabled:opacity-50"
              >
                다음
              </button>
            </div>
          )}
          {pinReorderMode && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={pinSaving}
                onClick={() => void handleSavePinOrder()}
                className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {pinSaving ? "저장 중..." : "핀 공지 순서 저장"}
              </button>
            </div>
          )}
        </section>

        {/* 광고 배너 관리 (위치별 1개만) */}
        <section className="mb-6 rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--text)]">광고 배너 관리</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                각 위치별로 항상 한 개의 광고 배너만 활성화됩니다.
              </p>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-[var(--text)]">홈 화면 하단 배너</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    HOME_BOTTOM 위치에 노출되는 배너입니다.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAd({
                        title: homeBottomAd?.title ?? "",
                        imageUrl: homeBottomAd?.imageUrl ?? "",
                        placement: "HOME_BOTTOM",
                      });
                    }}
                    className="flex h-8 items-center gap-1 rounded-2xl border border-[var(--border-base)] bg-white px-3 text-[11px] font-semibold text-[var(--text)] hover:bg-[var(--border-base)]"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2.3} />
                    배너 변경
                  </button>
                  <button
                    type="button"
                    disabled={!homeBottomAd}
                    onClick={() => void handleDeleteAd("HOME_BOTTOM")}
                    className={`flex h-8 items-center justify-center rounded-2xl border px-3 text-[11px] font-semibold ${
                      !homeBottomAd
                        ? "cursor-not-allowed border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text-muted)] opacity-60"
                        : "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
                    }`}
                  >
                    삭제
                  </button>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-[var(--border-base)] bg-white">
                {homeBottomAd?.imageUrl ? (
                  <img
                    src={homeBottomAd.imageUrl}
                    alt={homeBottomAd.title}
                    className="h-24 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 items-center justify-center text-[11px] font-semibold text-[var(--accent)]">
                    등록된 배너가 없습니다.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-[var(--text)]">내 티켓 화면 배너</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    MY_TICKET 위치에 노출되는 배너입니다.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAd({
                        title: myTicketAd?.title ?? "",
                        imageUrl: myTicketAd?.imageUrl ?? "",
                        placement: "MY_TICKET",
                      });
                    }}
                    className="flex h-8 items-center gap-1 rounded-2xl border border-[var(--border-base)] bg-white px-3 text-[11px] font-semibold text-[var(--text)] hover:bg-[var(--border-base)]"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2.3} />
                    배너 변경
                  </button>
                  <button
                    type="button"
                    disabled={!myTicketAd}
                    onClick={() => void handleDeleteAd("MY_TICKET")}
                    className={`flex h-8 items-center justify-center rounded-2xl border px-3 text-[11px] font-semibold ${
                      !myTicketAd
                        ? "cursor-not-allowed border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text-muted)] opacity-60"
                        : "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
                    }`}
                  >
                    삭제
                  </button>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-[var(--border-base)] bg-white">
                {myTicketAd?.imageUrl ? (
                  <img
                    src={myTicketAd.imageUrl}
                    alt={myTicketAd.title}
                    className="h-24 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 items-center justify-center text-[11px] font-semibold text-[var(--accent)]">
                    등록된 배너가 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>

        {adLoading && (
            <p className="mt-3 text-xs text-[var(--text-muted)]">광고 정보를 불러오는 중입니다...</p>
          )}
        </section>
      </AdminShell>

      {/* 공지 작성/수정 모달 */}
      {editingNotice && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-[var(--text)]">
              {editingNotice.id ? "공지 수정" : "새 공지 등록"}
            </h3>
            <form className="mt-4 space-y-5" onSubmit={handleSubmitNotice}>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[var(--text)]">작성 주체</p>
                <div className="flex gap-3 text-sm">
                  {(["총학생회", "개발팀"] as NoticeAuthor[]).map((author) => (
                    <button
                      key={author}
                      type="button"
                      onClick={() =>
                        setEditingNotice((prev) =>
                          prev ? { ...prev, author } : prev,
                        )
                      }
                      className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 ${
                        editingNotice.author === author
                          ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]"
                          : "border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text-muted)]"
                      }`}
                    >
                      <span className="text-[10px]">•</span>
                      <span className="text-xs font-semibold">{author}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text)]">제목 입력</label>
                <input
                  type="text"
                  value={editingNotice.title}
                  onChange={(e) =>
                    setEditingNotice((prev) =>
                      prev ? { ...prev, title: e.target.value } : prev,
                    )
                  }
                  placeholder="공지사항 제목을 입력해주세요"
                  className="h-11 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text)]">
                  이미지 업로드 (최대 10장)
                </label>
                <div
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-6 text-center"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      void handleUploadNoticeImages(e.dataTransfer.files);
                    }
                  }}
                >
                  <UploadCloud className="h-8 w-8 text-[var(--text-muted)]" strokeWidth={2.3} />
                  <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">
                    이미지를 드래그&드롭하거나, 파일 선택 버튼을 눌러 업로드하세요.
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    (JPG, JPEG, PNG, WEBP / 1장당 최대 5MB, 최대 10장)
                  </p>
                  <div className="mt-3 flex w-full max-w-sm justify-center">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-95">
                      {noticeImageUploading ? "업로드 중..." : "파일 선택"}
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        disabled={noticeImageUploading}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            void handleUploadNoticeImages(e.target.files);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                  </div>
                  {editingNotice.images.length > 0 && (
                    <div className="mt-4 grid w-full max-w-sm grid-cols-3 gap-2">
                      {editingNotice.images.map((url) => {
                        const isThumbnail =
                          (editingNotice.thumbnailImageUrl || editingNotice.images[0]) === url;
                        return (
                          <button
                            key={url}
                            type="button"
                            onClick={() =>
                              setEditingNotice((prev) =>
                                prev ? { ...prev, thumbnailImageUrl: url } : prev,
                              )
                            }
                            className={`group relative h-20 overflow-hidden rounded-xl border ${
                              isThumbnail
                                ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/40"
                                : "border-[var(--border-base)]"
                            } bg-white`}
                          >
                            <img src={url} alt="공지 이미지" className="h-full w-full object-cover" />
                            {isThumbnail && (
                              <div className="absolute inset-0 flex items-start justify-end p-1">
                                <span className="rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-semibold text-white">
                                  대표 이미지
                                </span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingNotice((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        images: prev.images.filter((img) => img !== url),
                                        thumbnailImageUrl:
                                          prev.thumbnailImageUrl === url
                                            ? prev.images.filter((img) => img !== url)[0] ?? ""
                                            : prev.thumbnailImageUrl,
                                      }
                                    : prev,
                                );
                              }}
                              className="absolute inset-x-1 bottom-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white"
                            >
                              삭제
                            </button>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {editingNotice.images.length === 0 && (
                    <p className="mt-3 text-[11px] text-[var(--text-muted)]">
                      아직 업로드된 이미지가 없습니다.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text)]">본문 내용 입력</label>
                <textarea
                  rows={6}
                  value={editingNotice.content}
                  onChange={(e) =>
                    setEditingNotice((prev) =>
                      prev ? { ...prev, content: e.target.value } : prev,
                    )
                  }
                  placeholder="공지사항 본문을 입력해주세요"
                  className="w-full resize-none rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-3 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
                  <input
                    type="checkbox"
                    checked={editingNotice.isPinned}
                    onChange={(e) =>
                      setEditingNotice((prev) =>
                        prev ? { ...prev, isPinned: e.target.checked } : prev,
                      )
                    }
                    className="h-4 w-4 rounded border-[var(--border-base)] text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  맨 위 고정
                </label>

                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setEditingNotice(null)}
                    className="rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-2 text-[var(--text-muted)]"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="rounded-2xl bg-[var(--accent)] px-4 py-2 font-semibold text-white shadow-sm hover:brightness-95"
                  >
                    {editingNotice.id ? "수정하기" : "등록하기"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 광고 작성/수정 모달 (위치별 1개, 교체 저장) */}
      {editingAd && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-sm font-bold text-[var(--text)]">
              광고 배너 등록/교체
            </h3>
            <form className="mt-4 space-y-4" onSubmit={handleSubmitAd}>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text)]">광고 제목</label>
                <input
                  type="text"
                  value={editingAd.title}
                  onChange={(e) =>
                    setEditingAd((prev) => (prev ? { ...prev, title: e.target.value } : prev))
                  }
                  className="h-9 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-xs focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
                  placeholder="메인 배너 광고 제목"
                  required
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--text)]">
                    광고 이미지 업로드 (1장)
                  </label>
                  <div
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-6 text-center"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) void handleUploadAdImage(file);
                    }}
                  >
                    <UploadCloud className="h-8 w-8 text-[var(--text-muted)]" strokeWidth={2.3} />
                    <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">
                      이미지를 드래그&드롭하거나 파일 선택으로 업로드하세요.
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      (JPG, JPEG, PNG, WEBP / 1장당 최대 5MB)
                    </p>
                    <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-95">
                      {adImageUploading ? "업로드 중..." : "파일 선택"}
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        disabled={adImageUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void handleUploadAdImage(file);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                  </div>
                  {editingAd.imageUrl && (
                    <div className="mt-2 space-y-2">
                      <div className="overflow-hidden rounded-xl border border-[var(--border-base)] bg-white">
                        <img
                          src={editingAd.imageUrl}
                          alt={editingAd.title || "광고 미리보기"}
                          className="h-24 w-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setEditingAd(null)}
                  className="rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-2 text-[var(--text-muted)]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={adImageUploading}
                  className="rounded-2xl bg-[var(--accent)] px-4 py-2 font-semibold text-white shadow-sm hover:brightness-95"
                >
                  {editingAd.id ? "수정하기" : "등록하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Admin;
