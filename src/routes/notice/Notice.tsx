import { keepPreviousData } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { getNoticeDetail, getNotices } from "@/api/app/notice/noticeApi";
import { Dialog, DialogContent, DialogTitle } from "@/components/common/ui/dialog";
import { cn } from "@/components/common/ui/utils";
import { useDebouncedValue } from "@/hooks/app/useDebouncedValue";
import { appQueryKeys, useAppQuery } from "@/lib/query";

type CategoryKey = "ALL" | "GENERAL" | "EVENT";

function formatDate(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "." + month + "." + day;
}

const NOTICE_LIST_CARD_BASE_CLASS =
  "group flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left transition-transform active:scale-[0.99]";
const NOTICE_LIST_CARD_PINNED_CLASS =
  "border border-[var(--border-base)] bg-[var(--surface)] shadow-[0_8px_18px_var(--shadow-color)]";
const NOTICE_LIST_CARD_DEFAULT_CLASS =
  "border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[0_4px_12px_var(--shadow-color)]";
const NOTICE_PAGINATION_BUTTON_CLASS =
  "rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-1 disabled:opacity-50";

function Notice() {
  const [keyword, setKeyword] = useState("");
  const category: CategoryKey = "ALL";
  const [page, setPage] = useState(0);
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const wheelAccumXRef = useRef(0);
  const wheelCooldownRef = useRef(false);

  const debouncedKeyword = useDebouncedValue(keyword, 300);

  const noticeListQuery = useAppQuery({
    queryKey: appQueryKeys.noticeList({
      keyword: debouncedKeyword.trim(),
      category,
      page,
      size: 10,
    }),
    queryFn: ({ signal }) =>
      getNotices(
        {
          keyword: debouncedKeyword.trim() || undefined,
          category: category === "ALL" ? undefined : category,
          page,
          size: 10,
        },
        { signal },
      ),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const detailQuery = useAppQuery({
    queryKey: appQueryKeys.noticeDetail(selectedNoticeId ?? -1),
    enabled: selectedNoticeId !== null,
    queryFn: ({ signal }) => {
      if (selectedNoticeId === null) {
        throw new Error("공지 상세 대상이 없습니다.");
      }
      return getNoticeDetail(selectedNoticeId, { signal });
    },
    staleTime: 5 * 60_000,
  });

  const notices = useMemo(
    () => noticeListQuery.data?.content ?? [],
    [noticeListQuery.data],
  );
  const currentPage = noticeListQuery.data?.number ?? page;
  const totalPages = noticeListQuery.data?.totalPages ?? 0;
  const listError = noticeListQuery.error?.message ?? null;

  const detailNotice = detailQuery.data ?? null;
  const detailLoading = detailQuery.isPending;
  const detailError = detailQuery.error?.message ?? null;

  const noticePinned = useMemo(
    () => (notices ?? []).filter((n) => n.isPinned),
    [notices],
  );

  const noticeOthers = useMemo(
    () => (notices ?? []).filter((n) => !n.isPinned),
    [notices],
  );

  const handleOpenDetail = (id: number) => {
    setSelectedNoticeId(id);
    setActiveImageIndex(0);
    setDragStartX(null);
    wheelAccumXRef.current = 0;
    wheelCooldownRef.current = false;
  };

  const handleCloseDetail = () => {
    setSelectedNoticeId(null);
    setActiveImageIndex(0);
    setDragStartX(null);
    wheelAccumXRef.current = 0;
    wheelCooldownRef.current = false;
  };

  const handleChangePage = (nextPage: number) => {
    if (nextPage < 0 || nextPage >= totalPages) return;
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isDetailOpen = selectedNoticeId !== null;

  return (
    <div className="pb-5">
      {/* 상단 타이틀 & 검색 */}
      <section className="bg-[var(--surface)] px-4 pb-4 pt-4 shadow-[0_8px_24px_var(--shadow-color)]">
        <div className="mb-3">
          <p className="text-[11px] font-semibold text-[var(--accent)]">단짠 공지사항</p>
          <h1 className="mt-1 text-[20px] font-extrabold tracking-tight text-[var(--text)]">
            축제 소식 한눈에 보기
          </h1>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 rounded-full bg-[var(--surface-subtle)] px-4 py-2 shadow-inner">
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                if (page !== 0) {
                  setPage(0);
                }
              }}
              placeholder="공지 제목 또는 내용을 검색해 보세요"
              className="h-7 w-full bg-transparent text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* 목록 영역 */}
      <section className="mt-3 px-4">
        {listError && (
          <div className="mb-3 rounded-2xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-[12px] text-[var(--status-danger-text)]">
            <p>{listError}</p>
            <button
              type="button"
              onClick={() => {
                void noticeListQuery.refetch();
              }}
              className="mt-2 rounded-md border border-[var(--status-danger-border)] bg-[var(--surface)] px-2 py-1 text-[11px] font-semibold text-[var(--status-danger-text)]"
            >
              다시 시도
            </button>
          </div>
        )}

        {noticeListQuery.isPending && (notices ?? []).length === 0 && (
          <p className="py-8 text-center text-[12px] text-[var(--text-muted)]">
            공지사항을 불러오는 중입니다...
          </p>
        )}

        {!noticeListQuery.isPending &&
          !listError &&
          (noticePinned ?? []).length === 0 &&
          (noticeOthers ?? []).length === 0 && (
            <p className="py-8 text-center text-[12px] text-[var(--text-muted)]">
              아직 등록된 공지사항이 없습니다.
            </p>
          )}

        <div className="space-y-2.5">
          {noticePinned.map((notice) => (
            <button
              key={notice.id}
              type="button"
              onClick={() => handleOpenDetail(notice.id)}
              className={cn(NOTICE_LIST_CARD_BASE_CLASS, NOTICE_LIST_CARD_PINNED_CLASS)}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--surface-tint-subtle)] text-[11px] font-semibold text-[var(--accent)]">
                  ★
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[var(--text)]">
                    {notice.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--text-muted)]">
                    {notice.content}
                  </p>
                </div>
              </div>
              <span className="ml-2 flex-shrink-0 text-[11px] text-[var(--text-muted)]">
                {formatDate(notice.createdAt)}
              </span>
            </button>
          ))}

          {noticeOthers.map((notice) => (
            <button
              key={notice.id}
              type="button"
              onClick={() => handleOpenDetail(notice.id)}
              className={cn(NOTICE_LIST_CARD_BASE_CLASS, NOTICE_LIST_CARD_DEFAULT_CLASS)}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                {notice.thumbnailImageUrl && (
                  <div className="flex h-9 w-9 flex-shrink-0 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
                    <img
                      src={notice.thumbnailImageUrl}
                      alt={notice.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[var(--text)]">
                    {notice.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--text-muted)]">
                    {notice.content}
                  </p>
                </div>
              </div>
              <span className="ml-2 flex-shrink-0 text-[11px] text-[var(--text-muted)]">
                {formatDate(notice.createdAt)}
              </span>
            </button>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-[var(--text-muted)]">
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => handleChangePage(currentPage - 1)}
              className={NOTICE_PAGINATION_BUTTON_CLASS}
            >
              이전
            </button>
            <span>
              {currentPage + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage + 1 >= totalPages}
              onClick={() => handleChangePage(currentPage + 1)}
              className={NOTICE_PAGINATION_BUTTON_CLASS}
            >
              다음
            </button>
          </div>
        )}
      </section>

      {/* 상세 보기 패널 */}
      <Dialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDetail();
          }
        }}
      >
        {isDetailOpen && (
          <DialogContent className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-3xl bg-[var(--surface)] p-0 shadow-[0_18px_45px_var(--shadow-color)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
              <DialogTitle className="text-[13px] font-semibold text-[var(--text)]">공지 상세</DialogTitle>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)]"
              >
                닫기
              </button>
            </div>

            <div className="max-h-[calc(90vh-52px)] overflow-y-auto px-5 py-4">
              {detailLoading && (
                <p className="py-6 text-center text-[12px] text-[var(--text-muted)]">
                  공지 상세를 불러오는 중입니다...
                </p>
              )}

              {detailError && !detailLoading && (
                <div className="py-6 text-center text-[12px] text-[var(--status-danger-text)]">
                  <p>{detailError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      void detailQuery.refetch();
                    }}
                    className="mt-2 rounded-md border border-[var(--status-danger-border)] bg-[var(--surface)] px-2 py-1 text-[11px] font-semibold text-[var(--status-danger-text)]"
                  >
                    다시 시도
                  </button>
                </div>
              )}

              {detailNotice && !detailLoading && (
                <article>
                  <header className="border-b border-[var(--border-subtle)] pb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--status-warning-text)]">
                      FESTIVAL NOTICE
                    </p>
                    <h2 className="mt-1 text-[15px] font-extrabold leading-snug text-[var(--text)]">
                      {detailNotice.title}
                    </h2>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span>{detailNotice.author}</span>
                      <span>{formatDate(detailNotice.createdAt)}</span>
                    </div>
                  </header>

                  {(detailNotice.imageUrls?.length ?? 0) > 0 ? (
                    <div className="mt-3">
                      <div
                        className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]"
                        onTouchStart={(e) => {
                          if (e.touches.length === 1) {
                            setDragStartX(e.touches[0].clientX);
                          }
                        }}
                        onTouchEnd={(e) => {
                          if (dragStartX == null || !detailNotice.imageUrls) return;
                          const endX = e.changedTouches[0]?.clientX ?? dragStartX;
                          const delta = endX - dragStartX;
                          const threshold = 40;
                          const maxIndex = detailNotice.imageUrls.length - 1;

                          if (delta <= -threshold && activeImageIndex < maxIndex) {
                            setActiveImageIndex((prev) => Math.min(prev + 1, maxIndex));
                          } else if (delta >= threshold && activeImageIndex > 0) {
                            setActiveImageIndex((prev) => Math.max(prev - 1, 0));
                          }

                          setDragStartX(null);
                        }}
                        onMouseDown={(e) => {
                          if (e.button !== 0) return;
                          setDragStartX(e.clientX);
                        }}
                        onMouseUp={(e) => {
                          if (dragStartX == null || !detailNotice.imageUrls) return;
                          const endX = e.clientX ?? dragStartX;
                          const delta = endX - dragStartX;
                          const threshold = 40;
                          const maxIndex = detailNotice.imageUrls.length - 1;

                          if (delta <= -threshold && activeImageIndex < maxIndex) {
                            setActiveImageIndex((prev) => Math.min(prev + 1, maxIndex));
                          } else if (delta >= threshold && activeImageIndex > 0) {
                            setActiveImageIndex((prev) => Math.max(prev - 1, 0));
                          }

                          setDragStartX(null);
                        }}
                        onWheel={(e) => {
                          if (!detailNotice.imageUrls?.length) return;
                          const dx = e.deltaX;
                          const dy = e.deltaY;
                          if (Math.abs(dx) <= Math.abs(dy)) return;

                          const threshold = 80;
                          const maxIndex = detailNotice.imageUrls.length - 1;

                          wheelAccumXRef.current += dx;

                          if (wheelCooldownRef.current) return;

                          if (wheelAccumXRef.current >= threshold && activeImageIndex > 0) {
                            e.preventDefault();
                            wheelCooldownRef.current = true;
                            setActiveImageIndex((prev) => Math.max(prev - 1, 0));
                            wheelAccumXRef.current = 0;
                            window.setTimeout(() => {
                              wheelCooldownRef.current = false;
                            }, 220);
                          } else if (wheelAccumXRef.current <= -threshold && activeImageIndex < maxIndex) {
                            e.preventDefault();
                            wheelCooldownRef.current = true;
                            setActiveImageIndex((prev) => Math.min(prev + 1, maxIndex));
                            wheelAccumXRef.current = 0;
                            window.setTimeout(() => {
                              wheelCooldownRef.current = false;
                            }, 220);
                          }
                        }}
                      >
                        <img
                          src={detailNotice.imageUrls?.[activeImageIndex]}
                          alt={detailNotice.title}
                          className="max-h-60 w-full object-cover"
                        />
                        <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-[var(--admin-dialog-overlay-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-on-accent)]">
                          {activeImageIndex + 1} / {detailNotice.imageUrls?.length ?? 0}
                        </div>
                      </div>
                      <div className="mt-2 flex justify-center">
                        <div className="flex items-center gap-1">
                          {detailNotice.imageUrls?.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveImageIndex(idx)}
                              className={cn(
                                "h-1.5 rounded-full transition-all",
                                activeImageIndex === idx
                                  ? "w-4 bg-[var(--accent)]"
                                  : "w-1.5 bg-[var(--border-subtle)]",
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : detailNotice.thumbnailImageUrl ? (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--border-subtle)]">
                      <img
                        src={detailNotice.thumbnailImageUrl}
                        alt={detailNotice.title}
                        className="max-h-60 w-full object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="mt-4 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--text)]">
                    {detailNotice.content}
                  </div>
                </article>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

export default Notice;
