// 역할: 관리자 공지/광고 운영 화면을 렌더링하고 편집 액션 훅을 조합합니다.
import { useCallback, useState } from "react";
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
import { useAdminAuth } from "@/hooks/app/admin/useAdminAuth";
import { useAdminAds } from "@/hooks/app/admin/useAdminAds";
import { useAdminNotices } from "@/hooks/app/admin/useAdminNotices";
import type { NoticeStatusFilter } from "@/api/app/admin/adminApi";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/common/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/common/ui/alert-dialog";
import { cn } from "@/components/common/ui/utils";
import { AdminShell } from "@/components/layout/AdminShell";
import { Toaster } from "sonner";
import {
  formatDate,
  type NoticeAuthor,
} from "@/routes/admin/admin-view-model";
import type { AdminConfirmDialogState } from "@/routes/admin/adminConfirmDialog";
import { useAdminAdActions } from "@/routes/admin/hooks/useAdminAdActions";
import { useAdminNoticeActions } from "@/routes/admin/hooks/useAdminNoticeActions";
import { useEmergencyNotice } from "@/routes/admin/hooks/useEmergencyNotice";
import {
  ADMIN_FOCUS_VISIBLE_RING_CLASS,
  ADMIN_PRIMARY_ACTION_BUTTON_CLASS,
  ADMIN_SECONDARY_ACTION_BUTTON_CLASS,
} from "@/routes/admin/adminStyleClasses";

const ADMIN_PINNED_NOTICE_ROW_CLASS = "bg-[var(--status-pending-bg)]";
const ADMIN_PINNED_NOTICE_BADGE_CLASS =
  "inline-flex items-center gap-1 rounded-full bg-[var(--status-pending)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-on-accent)]";


function Admin() {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [confirmDialogState, setConfirmDialogState] = useState<AdminConfirmDialogState | null>(null);
  const [confirming, setConfirming] = useState(false);
  const handleAdminDataError = useCallback((message: string) => {
    setGlobalError(message);
  }, []);

  const closeConfirmDialog = useCallback(() => {
    if (confirming) {
      return;
    }
    setConfirmDialogState(null);
  }, [confirming]);

  const handleConfirmAction = useCallback(async () => {
    const current = confirmDialogState;
    if (!current) {
      return;
    }

    try {
      setConfirming(true);
      await current.onConfirm();
      setConfirmDialogState(null);
    } finally {
      setConfirming(false);
    }
  }, [confirmDialogState]);

  const {
    noticeKeyword,
    setNoticeKeyword,
    noticePage,
    noticeTotalPages,
    notices,
    noticeLoading,
    noticeStatus,
    setNoticeStatus,
    reloadNotices,
  } = useAdminNotices({
    onError: handleAdminDataError,
  });

  const {
    adLoading,
    allAds,
    reloadAds,
  } = useAdminAds({
    onError: handleAdminDataError,
  });

  const {
    emergencyMessage,
    setEmergencyMessage,
    emergencyActive,
    setEmergencyActive,
    emergencyLoading,
    handleSaveEmergency,
  } = useEmergencyNotice({
    setGlobalError,
  });

  const {
    editingNotice,
    setEditingNotice,
    noticePinned,
    noticeOthers,
    effectivePinned,
    pinReorderMode,
    pinSaving,
    noticeImageUploading,
    openNewNotice,
    openEditNotice,
    handleSubmitNotice,
    handleUploadNoticeImages,
    handleArchiveNotice,
    handleRestoreNotice,
    startPinReorder,
    cancelPinReorder,
    movePinnedItem,
    handleSavePinOrder,
  } = useAdminNoticeActions({
    notices,
    noticeStatus,
    noticePage,
    reloadNotices,
    setGlobalError,
    openConfirmDialog: (dialogState) => {
      setConfirmDialogState(dialogState);
    },
  });

  const {
    editingAd,
    setEditingAd,
    adImageUploading,
    openAddAdDialog,
    handleDeleteAdById,
    handleSubmitAd,
    handleUploadAdImage,
  } = useAdminAdActions({
    reloadAds,
    setGlobalError,
    openConfirmDialog: (dialogState) => {
      setConfirmDialogState(dialogState);
    },
  });

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <>
      <Toaster position="top-right" closeButton richColors />
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
              aria-label="지도 편집 (개발팀 전용)"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[var(--border-base)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-subtle)]"
            >
              <Map className="h-4 w-4" strokeWidth={2.3} />
              <span>지도 편집</span>
              <span className="rounded-full bg-[var(--status-warning-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--status-warning-text)]">
                개발팀 전용
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[var(--border-base)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-subtle)]"
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
        <section className="rounded-2xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-4 shadow-sm">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[var(--status-danger)]" strokeWidth={2.3} />
              <h2 className="text-sm font-bold text-[var(--status-danger)]">긴급 공지</h2>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-[var(--status-danger)]">
              <span>사용 여부</span>
              <button
                type="button"
                onClick={() => setEmergencyActive((prev) => !prev)}
                className={cn(
                  "inline-flex h-6 items-center rounded-full px-2 text-[11px] font-semibold transition-colors",
                  emergencyActive
                    ? "bg-[var(--status-danger)] text-[var(--text-on-accent)]"
                    : "bg-[var(--status-danger-border)] text-[var(--status-danger)]",
                )}
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
              className={cn(
                "w-full resize-none rounded-2xl border border-[var(--status-danger-border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--status-danger-border)] shadow-inner",
                ADMIN_FOCUS_VISIBLE_RING_CLASS,
                "focus-visible:border-[var(--status-danger-border)] focus-visible:ring-[var(--status-danger-border)]",
              )}
            />
            <div className="flex items-start justify-between gap-3 text-[11px] text-[var(--status-danger)]">
              <div className="space-y-1">
                <p>※ 한 줄 공지는 단 한 개만 사용됩니다.</p>
                <p>※ 긴급공지 내용을 비우고 저장하면 학생용 앱 홈에서 긴급공지 칸이 숨겨집니다.</p>
              </div>
              <button
                type="button"
                disabled={emergencyLoading}
                onClick={() => void handleSaveEmergency()}
                className={cn(
                  "inline-flex items-center gap-1 rounded-2xl bg-[var(--status-danger)] px-3 py-1.5 text-xs font-semibold text-[var(--text-on-accent)] shadow-sm transition hover:brightness-95 disabled:opacity-60",
                  ADMIN_FOCUS_VISIBLE_RING_CLASS,
                )}
              >
                <Bell className="h-3.5 w-3.5" strokeWidth={2.4} />
                {emergencyLoading ? "저장 중..." : "긴급 공지 저장"}
              </button>
            </div>
          </div>
        </section>

        {/* 일반 공지 목록 */}
        <section className="rounded-2xl border border-[var(--border-base)] bg-[var(--surface)] p-4 shadow-sm">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--text)]">일반 공지 목록</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                앱 노출 공지와 보관함 공지를 함께 관리할 수 있습니다.
              </p>
              <p className="mt-1 text-[11px] text-[var(--status-info-text)]">
                ※ 보관함으로 이동한 공지는 학생용 앱 공지사항에서 보이지 않으며, 보관함 탭에서 다시 복원할 수 있습니다.
              </p>
              <div className="mt-2 flex flex-wrap gap-1 text-[11px] font-semibold">
                {([
                  { key: "ACTIVE", label: "앱 노출중" },
                  { key: "DELETED", label: "보관함" },
                  { key: "ALL", label: "전체" },
                ] satisfies { key: NoticeStatusFilter; label: string }[]).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setNoticeStatus(item.key);
                      void reloadNotices(0, noticeKeyword, item.key);
                    }}
                    className={cn(
                      "rounded-full px-3 py-1",
                      noticeStatus === item.key
                        ? "bg-[var(--accent)] text-[var(--text-on-accent)]"
                        : "bg-[var(--surface-subtle)] text-[var(--text-muted)]",
                    )}
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
                className={cn(
                  "h-9 w-40 rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-xs placeholder:text-[var(--text-muted)]",
                  ADMIN_FOCUS_VISIBLE_RING_CLASS,
                  "focus-visible:border-[var(--accent)] focus-visible:ring-[var(--ring)]",
                )}
              />
              <button
                type="button"
                onClick={() => void reloadNotices(0, noticeKeyword)}
                className={cn(
                  "h-9 rounded-2xl bg-[var(--accent)] px-3 text-xs font-semibold text-[var(--text-on-accent)] shadow-sm hover:brightness-95",
                  ADMIN_FOCUS_VISIBLE_RING_CLASS,
                )}
              >
                검색
              </button>
              <button
                type="button"
                disabled={noticeStatus !== "ACTIVE"}
                onClick={pinReorderMode ? cancelPinReorder : startPinReorder}
                className={cn(
                  "flex h-9 items-center gap-1 rounded-2xl border px-3 text-xs font-semibold",
                  noticeStatus !== "ACTIVE"
                    ? "cursor-not-allowed border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text-muted)] opacity-60"
                    : pinReorderMode
                      ? "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]"
                      : "border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text)] hover:bg-[var(--border-base)]",
                )}
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
                  <th className="border-r border-[var(--border-base)] px-4 py-2 text-sm font-semibold">제목 / 썸네일</th>
                  <th className="border-r border-[var(--border-base)] px-4 py-2 text-sm font-semibold">작성자</th>
                  <th className="border-r border-[var(--border-base)] px-4 py-2 text-sm font-semibold">날짜</th>
                  <th className="border-r border-[var(--border-base)] px-3 py-2 text-center text-sm font-semibold">
                    {noticeStatus === "ALL" ? "상태" : pinReorderMode ? "순서" : "수정"}
                  </th>
                  <th className="px-3 py-2 text-center text-sm font-semibold">
                    {noticeStatus === "DELETED" ? "복원" : "보관함 이동"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-base)] bg-[var(--surface)]">
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
                  <tr key={notice.id} className={ADMIN_PINNED_NOTICE_ROW_CLASS}>
                    <td className="border-r border-[var(--border-base)] px-4 py-2 align-middle">
                      <div className="flex items-center gap-2">
                        <span className={ADMIN_PINNED_NOTICE_BADGE_CLASS}>
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
                    <td className="border-r border-[var(--border-base)] px-4 py-2 text-[var(--text-muted)]">{notice.author}</td>
                    <td className="border-r border-[var(--border-base)] px-4 py-2 text-[var(--text-muted)]">
                      {formatDate(notice.createdAt)}
                    </td>
                    <td className="border-r border-[var(--border-base)] px-3 py-2 text-center">
                      {noticeStatus === "ALL" ? (
                        <span
                          className={cn(
                            "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            notice.isActive === false
                              ? "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)]"
                              : "bg-[var(--status-success-bg)] text-[var(--status-success)]",
                          )}
                        >
                          {notice.isActive === false ? "보관함" : "앱 노출중"}
                        </span>
                      ) : pinReorderMode ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => movePinnedItem(index, "up")}
                            aria-label={`${notice.title} 핀 공지 위로 이동`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] disabled:opacity-40"
                          >
                            <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.3} />
                          </button>
                          <button
                            type="button"
                            disabled={index === effectivePinned.length - 1}
                            onClick={() => movePinnedItem(index, "down")}
                            aria-label={`${notice.title} 핀 공지 아래로 이동`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] disabled:opacity-40"
                          >
                            <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.3} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openEditNotice(notice)}
                          aria-label={`${notice.title} 공지 수정`}
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
                          aria-label={`${notice.title} 공지 복원`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)] hover:bg-[var(--status-success-border)]"
                        >
                          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.3} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleArchiveNotice(notice.id)}
                          aria-label={`${notice.title} 공지 보관함 이동`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--status-danger-bg)] text-[var(--status-danger)] hover:bg-[var(--status-danger-border)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {noticeOthers.map((notice) => (
                  <tr key={notice.id}>
                    <td className="border-r border-[var(--border-base)] px-4 py-2 align-middle">
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
                    <td className="border-r border-[var(--border-base)] px-4 py-2 text-[var(--text-muted)]">{notice.author}</td>
                    <td className="border-r border-[var(--border-base)] px-4 py-2 text-[var(--text-muted)]">
                      {formatDate(notice.createdAt)}
                    </td>
                    <td className="border-r border-[var(--border-base)] px-3 py-2 text-center">
                      {pinReorderMode ? (
                        <span className="text-[11px] text-[var(--text-muted)]">-</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openEditNotice(notice)}
                          aria-label={`${notice.title} 공지 수정`}
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
                          aria-label={`${notice.title} 공지 복원`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)] hover:bg-[var(--status-success-border)]"
                        >
                          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.3} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleArchiveNotice(notice.id)}
                          aria-label={`${notice.title} 공지 보관함 이동`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--status-danger-bg)] text-[var(--status-danger)] hover:bg-[var(--status-danger-border)]"
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
                className="inline-flex items-center gap-1 rounded-full bg-[var(--status-warning)] px-3 py-1.5 text-xs font-semibold text-[var(--text-on-accent)] disabled:opacity-60"
              >
                {pinSaving ? "저장 중..." : "핀 공지 순서 저장"}
              </button>
            </div>
          )}
        </section>

        {/* 광고 배너 관리 */}
        <section className="mb-6 rounded-2xl border border-[var(--border-base)] bg-[var(--surface)] p-4 shadow-sm">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--text)]">광고 배너 관리</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                등록된 이미지가 홈 화면·내 티켓 화면에서 랜덤 순서로 5초마다 슬라이딩됩니다. 수량 제한 없음.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddAdDialog}
              className="flex h-9 items-center gap-1.5 rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-xs font-semibold text-[var(--text)] hover:bg-[var(--border-base)]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.3} />
              이미지 추가
            </button>
          </header>

          {adLoading ? (
            <p className="text-xs text-[var(--text-muted)]">광고 정보를 불러오는 중입니다...</p>
          ) : allAds.length === 0 ? (
            <div className="flex h-24 items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-base)] text-xs text-[var(--text-muted)]">
              등록된 광고 이미지가 없습니다. 이미지 추가 버튼으로 등록해 주세요.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {allAds.map((ad) => (
                <div
                  key={ad.id}
                  className="group relative overflow-hidden rounded-xl border border-[var(--border-base)] bg-[var(--surface-subtle)]"
                >
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="h-[70px] w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-start justify-end bg-gradient-to-b from-black/30 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => void handleDeleteAdById(ad.id)}
                      aria-label="광고 이미지 삭제"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--status-danger)] text-[var(--text-on-accent)] shadow-md"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={2.5} />
                    </button>
                  </div>
                  <div className="px-2 pb-1 pt-0.5">
                    <p className="truncate text-[10px] text-[var(--text-muted)]">{ad.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-1 text-[11px] text-[var(--text-muted)]">
            <p className="font-semibold text-[var(--text)]">배너 권장 규격</p>
            <p>• 권장 크기: 1260 × 280 px (최소 630 × 140 px 이상) / 권장 비율: 9 : 2</p>
            <p>• 중요한 로고·문구는 중앙 안전 영역(328px 이내)에 배치해 주세요. (기기별 양 끝 잘림 가능)</p>
            <p>• object-cover 방식으로 기기에 따라 이미지가 약간 확대되어 보일 수 있습니다.</p>
          </div>
        </section>
      </AdminShell>

      {/* 공지 작성/수정 모달 */}
      <Dialog
        open={Boolean(editingNotice)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingNotice(null);
          }
        }}
      >
        {editingNotice && (
          <DialogContent className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <DialogTitle className="text-base font-bold text-[var(--text)]">
              {editingNotice.id ? "공지 수정" : "새 공지 등록"}
            </DialogTitle>
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
                      className={cn(
                        "flex items-center gap-2 rounded-2xl border px-3 py-1.5",
                        editingNotice.author === author
                          ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]"
                          : "border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text-muted)]",
                      )}
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
                  className={cn(
                    "h-11 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 text-sm",
                    ADMIN_FOCUS_VISIBLE_RING_CLASS,
                    "focus-visible:border-[var(--accent)] focus-visible:ring-[var(--ring)]",
                  )}
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
                    <label className={cn(
                      "inline-flex cursor-pointer items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--text-on-accent)] shadow-sm hover:brightness-95",
                      ADMIN_FOCUS_VISIBLE_RING_CLASS,
                    )}>
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
                          <div
                            key={url}
                            className={cn(
                              "group relative h-20 overflow-hidden rounded-xl border bg-[var(--surface)]",
                              isThumbnail
                                ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/40"
                                : "border-[var(--border-base)]",
                            )}
                          >
                            <img src={url} alt="공지 이미지" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() =>
                                setEditingNotice((prev) =>
                                  prev ? { ...prev, thumbnailImageUrl: url } : prev,
                                )
                              }
                              aria-label={isThumbnail ? "대표 이미지로 선택됨" : "대표 이미지로 선택"}
                              className="absolute inset-0"
                            />
                            {isThumbnail && (
                              <div className="absolute inset-0 flex items-start justify-end p-1">
                                <span className="rounded-full bg-[var(--admin-dialog-overlay-bg)] px-2 py-0.5 text-[9px] font-semibold text-[var(--text-on-accent)]">
                                  대표 이미지
                                </span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
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
                              aria-label="공지 이미지 삭제"
                              className="absolute inset-x-1 bottom-1 z-10 rounded-full bg-[var(--admin-dialog-overlay-bg)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--text-on-accent)]"
                            >
                              삭제
                            </button>
                          </div>
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
                  className={cn(
                    "w-full resize-none rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-3 text-sm",
                    ADMIN_FOCUS_VISIBLE_RING_CLASS,
                    "focus-visible:border-[var(--accent)] focus-visible:ring-[var(--ring)]",
                  )}
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
                    className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className={ADMIN_PRIMARY_ACTION_BUTTON_CLASS}
                  >
                    {editingNotice.id ? "수정하기" : "등록하기"}
                  </button>
                </div>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* 광고 이미지 추가 모달 */}
      <Dialog
        open={Boolean(editingAd)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingAd(null);
          }
        }}
      >
        {editingAd && (
          <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[var(--surface)] p-5 shadow-xl">
            <DialogTitle className="text-sm font-bold text-[var(--text)]">
              광고 이미지 추가
            </DialogTitle>
            <form className="mt-4 space-y-4" onSubmit={handleSubmitAd}>
              {/* 제목 입력 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text)]">
                  광고 제목 <span className="text-[var(--status-danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={editingAd.title}
                  onChange={(e) =>
                    setEditingAd((prev) => prev ? { ...prev, title: e.target.value } : prev)
                  }
                  placeholder="예: 단국대 축제 후원사 배너"
                  maxLength={50}
                  className={cn(
                    "h-10 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 text-sm",
                    ADMIN_FOCUS_VISIBLE_RING_CLASS,
                    "focus-visible:border-[var(--accent)] focus-visible:ring-[var(--ring)]",
                  )}
                  required
                />
              </div>

              {/* 이미지 업로드 */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text)]">
                  광고 이미지 업로드 <span className="text-[var(--status-danger)]">*</span>
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
                    (JPG, JPEG, PNG, WEBP / 최대 5MB)
                  </p>
                  <label className={cn(
                    "mt-3 inline-flex cursor-pointer items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--text-on-accent)] shadow-sm hover:brightness-95",
                    ADMIN_FOCUS_VISIBLE_RING_CLASS,
                  )}>
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
                  <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-xl border border-[var(--border-base)]">
                    <img
                      src={editingAd.imageUrl}
                      alt="업로드된 광고 미리보기"
                      className="h-[70px] w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {(!editingAd.title.trim() || !editingAd.imageUrl) && (
                  <p className="text-right text-[11px] text-[var(--text-muted)]">
                    {!editingAd.title.trim() && !editingAd.imageUrl
                      ? "제목과 이미지를 모두 입력해 주세요."
                      : !editingAd.title.trim()
                        ? "광고 제목을 입력해 주세요."
                        : "이미지를 업로드해 주세요."}
                  </p>
                )}
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setEditingAd(null)}
                    className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={adImageUploading || !editingAd.imageUrl || !editingAd.title.trim()}
                    className={ADMIN_PRIMARY_ACTION_BUTTON_CLASS}
                  >
                    {adImageUploading ? "업로드 중..." : "등록하기"}
                  </button>
                </div>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>

      <AlertDialog
        open={Boolean(confirmDialogState)}
        onOpenChange={(open) => {
          if (!open) {
            closeConfirmDialog();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialogState?.title ?? "확인"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialogState?.description ?? ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirming}>취소</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirming}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmAction();
              }}
            >
              {confirming ? "처리 중..." : (confirmDialogState?.confirmLabel ?? "확인")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default Admin;
