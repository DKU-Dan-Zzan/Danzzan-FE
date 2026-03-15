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
} from "lucide-react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import {
  createAdminLostItem,
  createAdminNotice,
  deleteAdminLostItem,
  deleteAdminNotice,
  getAdminLostItems,
  getAdminNotices,
  getEmergencyAdminNotice,
  type LostItemResponse,
  type LostItemStatusFilter,
  type NoticeStatusFilter,
  type NoticeResponse,
  restoreAdminNotice,
  updateAdminLostItem,
  updateAdminNotice,
  updateNoticeDisplayOrder,
  updateEmergencyAdminNotice,
} from "../../api/admin";

type NoticeAuthor = "개발팀" | "총학생회";

type NoticeFormState = {
  id?: number;
  title: string;
  content: string;
  author: NoticeAuthor;
  isPinned: boolean;
  thumbnailImageUrl: string;
};

type LostItemFormState = {
  id?: number;
  itemName: string;
  imageUrl: string;
  foundLocation: string;
  foundDate: string;
  isClaimed: boolean;
  receiverName: string;
  receiverNote: string;
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

  // 분실물
  const [lostStatus, setLostStatus] = useState<LostItemStatusFilter>("ALL");
  const [lostPage, setLostPage] = useState(0);
  const [lostTotalPages, setLostTotalPages] = useState(0);
  const [lostItems, setLostItems] = useState<LostItemResponse[]>([]);
  const [lostLoading, setLostLoading] = useState(false);
  const [editingLostItem, setEditingLostItem] = useState<LostItemFormState | null>(null);

  const [initialLoaded, setInitialLoaded] = useState(false);

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
        setLostLoading(true);

        const [emergencyRes, noticePageRes, lostPageRes] = await Promise.all([
          getEmergencyAdminNotice(),
          getAdminNotices({ page: 0, size: 10, status: "ACTIVE" }),
          getAdminLostItems({ status: "ALL", page: 0, size: 10 }),
        ]);

        setEmergencyMessage(emergencyRes.message ?? "");
        setEmergencyActive(Boolean(emergencyRes.isActive));

        setNotices(noticePageRes.content);
        setNoticePage(noticePageRes.number);
        setNoticeTotalPages(noticePageRes.totalPages);

        setLostItems(lostPageRes.content);
        setLostPage(lostPageRes.number);
        setLostTotalPages(lostPageRes.totalPages);
      } catch (error) {
        setGlobalError(error instanceof Error ? error.message : "데이터를 불러오지 못했습니다.");
      } finally {
        setEmergencyLoading(false);
        setNoticeLoading(false);
        setLostLoading(false);
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

  // 분실물 재조회
  const reloadLostItems = async (page = 0, status = lostStatus) => {
    try {
      setGlobalError(null);
      setLostLoading(true);
      const res = await getAdminLostItems({ status, page, size: 10 });
      setLostItems(res.content);
      setLostPage(res.number);
      setLostTotalPages(res.totalPages);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "분실물 목록을 불러오지 못했습니다.");
    } finally {
      setLostLoading(false);
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

  const openNewLostItem = () => {
    setEditingLostItem({
      itemName: "",
      imageUrl: "",
      foundLocation: "",
      foundDate: "",
      isClaimed: false,
      receiverName: "",
      receiverNote: "",
    });
  };

  const openEditLostItem = (item: LostItemResponse) => {
    setEditingLostItem({
      id: item.id,
      itemName: item.itemName,
      imageUrl: item.imageUrl ?? "",
      foundLocation: item.foundLocation,
      foundDate: item.foundDate,
      isClaimed: item.isClaimed,
      receiverName: item.receiverName ?? "",
      receiverNote: item.receiverNote ?? "",
    });
  };

  const handleSubmitLostItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingLostItem) return;

    const payloadBase = {
      itemName: editingLostItem.itemName.trim(),
      imageUrl: editingLostItem.imageUrl.trim() || null,
      foundLocation: editingLostItem.foundLocation.trim(),
      foundDate: editingLostItem.foundDate,
    };

    if (!payloadBase.itemName || !payloadBase.foundLocation || !payloadBase.foundDate) {
      setGlobalError("물건 이름, 습득 장소, 습득 날짜를 모두 입력해 주세요.");
      return;
    }

    try {
      setGlobalError(null);
      if (editingLostItem.id) {
        await updateAdminLostItem(editingLostItem.id, {
          ...payloadBase,
          isClaimed: editingLostItem.isClaimed,
          receiverName: editingLostItem.isClaimed
            ? editingLostItem.receiverName.trim() || null
            : null,
          receiverNote: editingLostItem.isClaimed
            ? editingLostItem.receiverNote.trim() || null
            : null,
        });
      } else {
        await createAdminLostItem({
          ...payloadBase,
          isClaimed: editingLostItem.isClaimed,
          receiverName: editingLostItem.isClaimed
            ? editingLostItem.receiverName.trim() || null
            : null,
          receiverNote: editingLostItem.isClaimed
            ? editingLostItem.receiverNote.trim() || null
            : null,
        });
      }
      setEditingLostItem(null);
      await reloadLostItems(lostPage, lostStatus);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "분실물을 저장하지 못했습니다.");
    }
  };

  const handleDeleteLostItem = async (id: number) => {
    const confirmed = window.confirm("이 분실물 기록을 삭제하시겠습니까?");
    if (!confirmed) return;
    try {
      setGlobalError(null);
      await deleteAdminLostItem(id);
      await reloadLostItems(lostPage, lostStatus);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "분실물을 삭제하지 못했습니다.");
    }
  };

  return (
    <div className="min-h-dvh bg-[var(--bg-base)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border-base)] bg-[var(--bg-base)]">
        <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between px-8 py-3">
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              ADMIN PORTAL
            </p>
            <h1 className="text-2xl font-semibold text-[var(--text)]">
              공지사항 및 분실물 관리자 페이지
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[var(--border-base)] bg-[var(--surface-subtle)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
              운영자: 관리자
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[var(--border-base)] bg-white px-3 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-subtle)]"
            >
              <LogOut className="h-4 w-4" strokeWidth={2.3} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5">
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
                  <th className="px-4 py-2 font-semibold">제목</th>
                  <th className="px-4 py-2 font-semibold">작성자</th>
                  <th className="px-4 py-2 font-semibold">날짜</th>
                  <th className="px-3 py-2 text-center font-semibold">
                    {pinReorderMode ? "순서" : "수정"}
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
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                          <span>📌</span>
                          <span>상단 고정</span>
                        </span>
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
                      {pinReorderMode ? (
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
                      <span className="truncate text-sm text-[var(--text)]">{notice.title}</span>
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

        {/* 분실물 목록 */}
        <section className="mb-6 rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--text)]">분실물 목록</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                인수 여부에 따라 필터링하고 인수자 정보를 기록할 수 있습니다.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-full bg-[var(--surface-subtle)] p-0.5 text-xs font-semibold">
                {(["ALL", "UNCLAIMED", "CLAIMED"] as LostItemStatusFilter[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setLostStatus(status);
                      void reloadLostItems(0, status);
                    }}
                    className={`rounded-full px-3 py-1 ${
                      lostStatus === status
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {status === "ALL" && "전체"}
                    {status === "UNCLAIMED" && "미인수"}
                    {status === "CLAIMED" && "인수완료"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={openNewLostItem}
                className="flex h-9 items-center gap-1 rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-xs font-semibold text-[var(--text)] hover:bg-[var(--border-base)]"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.3} />
                새 분실물
              </button>
            </div>
          </header>

          <div className="overflow-hidden rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)]">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2 font-semibold">이미지</th>
                  <th className="px-4 py-2 font-semibold">물건 이름</th>
                  <th className="px-4 py-2 font-semibold">습득 장소</th>
                  <th className="px-4 py-2 font-semibold">습득 날짜</th>
                  <th className="px-4 py-2 font-semibold">인수 여부</th>
                  <th className="px-3 py-2 text-center font-semibold">수정</th>
                  <th className="px-3 py-2 text-center font-semibold">삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-base)] bg-white">
                {lostLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-[var(--text-muted)]">
                      분실물 목록을 불러오는 중입니다...
                    </td>
                  </tr>
                )}
                {!lostLoading && lostItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-[var(--text-muted)]">
                      등록된 분실물이 없습니다.
                    </td>
                  </tr>
                )}
                {lostItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.itemName}
                          className="h-9 w-9 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-dashed border-[var(--border-base)] bg-[var(--surface-subtle)] text-[10px] text-[var(--text-muted)]">
                          없음
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 align-middle">
                      <div className="flex flex-col">
                        <span className="text-sm text-[var(--text)]">{item.itemName}</span>
                        {item.receiverName && (
                          <span className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                            인수자: {item.receiverName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">
                      {item.foundLocation}
                    </td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">
                      {formatDate(item.foundDate)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          item.isClaimed
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.isClaimed ? "인수완료" : "미인수"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => openEditLostItem(item)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:bg-[var(--border-base)]"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2.3} />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => void handleDeleteLostItem(item.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {lostTotalPages > 1 && (
            <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-[var(--text-muted)]">
              <button
                type="button"
                disabled={lostPage === 0}
                onClick={() => void reloadLostItems(lostPage - 1)}
                className="rounded-full border border-[var(--border-base)] bg-[var(--surface-subtle)] px-2 py-1 disabled:opacity-50"
              >
                이전
              </button>
              <span>
                {lostPage + 1} / {lostTotalPages}
              </span>
              <button
                type="button"
                disabled={lostPage + 1 >= lostTotalPages}
                onClick={() => void reloadLostItems(lostPage + 1)}
                className="rounded-full border border-[var(--border-base)] bg-[var(--surface-subtle)] px-2 py-1 disabled:opacity-50"
              >
                다음
              </button>
            </div>
          )}
        </section>
      </main>

      {/* 공지 작성/수정 모달 */}
      {editingNotice && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl">
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
                  썸네일 이미지 URL
                </label>
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-6 text-center">
                  <UploadCloud className="h-8 w-8 text-[var(--text-muted)]" strokeWidth={2.3} />
                  <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">
                    공지에 함께 노출할 썸네일 이미지를 설정할 수 있습니다.
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    (PNG, JPG 등 이미지 주소를 직접 입력해 주세요)
                  </p>
                  <div className="mt-3 flex w-full max-w-sm gap-2">
                    <input
                      type="url"
                      value={editingNotice.thumbnailImageUrl}
                      onChange={(e) =>
                        setEditingNotice((prev) =>
                          prev ? { ...prev, thumbnailImageUrl: e.target.value } : prev,
                        )
                      }
                      placeholder="https:// 예시..."
                      className="h-9 flex-1 rounded-2xl border border-[var(--border-base)] bg-white px-3 text-xs focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
                    />
                  </div>
                  {editingNotice.thumbnailImageUrl && (
                    <div className="mt-4 flex w-full max-w-sm flex-wrap gap-2">
                      <div className="group relative h-16 w-28 overflow-hidden rounded-xl border border-[var(--border-base)] bg-white">
                        <img
                          src={editingNotice.thumbnailImageUrl}
                          alt="공지 썸네일 미리보기"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setEditingNotice((prev) =>
                              prev ? { ...prev, thumbnailImageUrl: "" } : prev,
                            )
                          }
                          className="absolute right-1 top-1 hidden rounded-full bg-black/60 px-1.5 text-[10px] font-semibold text-white group-hover:inline"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
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
                    저장하기
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 분실물 작성/수정 모달 */}
      {editingLostItem && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <h3 className="text-sm font-bold text-[var(--text)]">
              {editingLostItem.id ? "분실물 수정" : "새 분실물 등록"}
            </h3>
            <form className="mt-3 space-y-3" onSubmit={handleSubmitLostItem}>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text)]">물건 이름</label>
                <input
                  type="text"
                  value={editingLostItem.itemName}
                  onChange={(e) =>
                    setEditingLostItem((prev) =>
                      prev ? { ...prev, itemName: e.target.value } : prev,
                    )
                  }
                  className="h-9 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-xs focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text)]">
                  이미지 URL (선택)
                </label>
                <input
                  type="url"
                  value={editingLostItem.imageUrl}
                  onChange={(e) =>
                    setEditingLostItem((prev) =>
                      prev ? { ...prev, imageUrl: e.target.value } : prev,
                    )
                  }
                  className="h-9 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-xs focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
                  placeholder="https:// 예시..."
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-[var(--text)]">습득 장소</label>
                  <input
                    type="text"
                    value={editingLostItem.foundLocation}
                    onChange={(e) =>
                      setEditingLostItem((prev) =>
                        prev ? { ...prev, foundLocation: e.target.value } : prev,
                      )
                    }
                    className="h-9 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-xs focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
                    required
                  />
                </div>
                <div className="w-32 space-y-1">
                  <label className="text-xs font-semibold text-[var(--text)]">습득 날짜</label>
                  <input
                    type="date"
                    value={editingLostItem.foundDate}
                    onChange={(e) =>
                      setEditingLostItem((prev) =>
                        prev ? { ...prev, foundDate: e.target.value } : prev,
                      )
                    }
                    className="h-9 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-xs focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
                  <input
                    type="checkbox"
                    checked={editingLostItem.isClaimed}
                    onChange={(e) =>
                      setEditingLostItem((prev) =>
                        prev ? { ...prev, isClaimed: e.target.checked } : prev,
                      )
                    }
                    className="h-4 w-4 rounded border-[var(--border-base)] text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  인수 완료 처리
                </label>
                {editingLostItem.isClaimed && (
                  <div className="mt-1 space-y-2 rounded-2xl bg-[var(--surface-subtle)] p-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[var(--text)]">
                        인수자 이름
                      </label>
                      <input
                        type="text"
                        value={editingLostItem.receiverName}
                        onChange={(e) =>
                          setEditingLostItem((prev) =>
                            prev ? { ...prev, receiverName: e.target.value } : prev,
                          )
                        }
                        className="h-8 w-full rounded-2xl border border-[var(--border-base)] bg-white px-3 text-[11px] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
                        placeholder="인수자 이름 (선택)"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[var(--text)]">
                        인수 메모
                      </label>
                      <textarea
                        rows={2}
                        value={editingLostItem.receiverNote}
                        onChange={(e) =>
                          setEditingLostItem((prev) =>
                            prev ? { ...prev, receiverNote: e.target.value } : prev,
                          )
                        }
                        className="w-full resize-none rounded-2xl border border-[var(--border-base)] bg-white px-3 py-1.5 text-[11px] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
                        placeholder="학생증 확인 후 인계 완료 등 메모"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setEditingLostItem(null)}
                  className="rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 py-1.5 text-[var(--text-muted)]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-[var(--accent)] px-3 py-1.5 font-semibold text-white shadow-sm hover:brightness-95"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
