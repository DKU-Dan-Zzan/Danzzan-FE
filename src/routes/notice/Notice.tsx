import { useEffect, useMemo, useRef, useState } from "react";
import { getNoticeDetail, getNotices, type NoticeDto } from "@/api/app/notice/noticeApi";
import { cn } from "@/components/common/ui/utils";

type CategoryKey = "ALL" | "GENERAL" | "EVENT";

type NoticePageState = {
  notices: NoticeDto[];
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
};

type DetailState = {
  notice: NoticeDto | null;
  loading: boolean;
  error: string | null;
};

function formatDate(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}.${month}.${day}`;
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
  const [category] = useState<CategoryKey>("ALL");
  const [pageState, setPageState] = useState<NoticePageState>({
    notices: [],
    page: 0,
    totalPages: 0,
    loading: true,
    error: null,
  });

  const [detailState, setDetailState] = useState<DetailState>({
    notice: null,
    loading: false,
    error: null,
  });
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const wheelAccumXRef = useRef(0);
  const wheelCooldownRef = useRef(false);

  useEffect(() => {
    let alive = true;

    const fetchList = async () => {
      setPageState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const res = await getNotices({
          keyword: keyword.trim() || undefined,
          category: category === "ALL" ? undefined : category,
          page: pageState.page,
          size: 10,
        });

        if (!alive) return;

        setPageState((prev) => ({
          ...prev,
          notices: res.content ?? [],
          page: res.number ?? 0,
          totalPages: res.totalPages ?? 0,
          loading: false,
          error: null,
        }));
      } catch (error) {
        if (!alive) return;
        setPageState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "공지 목록을 불러오지 못했습니다.",
        }));
      }
    };

    void fetchList();

    return () => {
      alive = false;
    };
  }, [keyword, category, pageState.page]);

  const noticePinned = useMemo(
    () => (pageState.notices ?? []).filter((n) => n.isPinned),
    [pageState.notices],
  );

  const noticeOthers = useMemo(
    () => (pageState.notices ?? []).filter((n) => !n.isPinned),
    [pageState.notices],
  );

  const handleOpenDetail = async (id: number) => {
    setDetailState({ notice: null, loading: true, error: null });
    try {
      const res = await getNoticeDetail(id);
      setDetailState({ notice: res, loading: false, error: null });
      setActiveImageIndex(0);
    } catch (error) {
      setDetailState({
        notice: null,
        loading: false,
        error: error instanceof Error ? error.message : "공지 상세를 불러오지 못했습니다.",
      });
    }
  };

  const handleCloseDetail = () => {
    setDetailState({ notice: null, loading: false, error: null });
    setActiveImageIndex(0);
    setDragStartX(null);
    wheelAccumXRef.current = 0;
    wheelCooldownRef.current = false;
  };

  const handleChangePage = (nextPage: number) => {
    if (nextPage < 0 || nextPage >= pageState.totalPages) return;
    setPageState((prev) => ({ ...prev, page: nextPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="공지 제목 또는 내용을 검색해 보세요"
              className="h-7 w-full bg-transparent text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* 목록 영역 */}
      <section className="mt-3 px-4">
        {pageState.error && (
          <div className="mb-3 rounded-2xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-[12px] text-[var(--status-danger-text)]">
            {pageState.error}
          </div>
        )}

        {pageState.loading && (pageState.notices ?? []).length === 0 && (
          <p className="py-8 text-center text-[12px] text-[var(--text-muted)]">
            공지사항을 불러오는 중입니다...
          </p>
        )}

        {!pageState.loading &&
          !pageState.error &&
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
              onClick={() => void handleOpenDetail(notice.id)}
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
              onClick={() => void handleOpenDetail(notice.id)}
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

        {pageState.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-[var(--text-muted)]">
            <button
              type="button"
              disabled={pageState.page === 0}
              onClick={() => handleChangePage(pageState.page - 1)}
              className={NOTICE_PAGINATION_BUTTON_CLASS}
            >
              이전
            </button>
            <span>
              {pageState.page + 1} / {pageState.totalPages}
            </span>
            <button
              type="button"
              disabled={pageState.page + 1 >= pageState.totalPages}
              onClick={() => handleChangePage(pageState.page + 1)}
              className={NOTICE_PAGINATION_BUTTON_CLASS}
            >
              다음
            </button>
          </div>
        )}
      </section>

      {/* 상세 보기 패널 */}
      {(detailState.notice || detailState.loading || detailState.error) && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[var(--admin-dialog-overlay-bg)] px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-3xl bg-[var(--surface)] shadow-[0_18px_45px_var(--shadow-color)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
              <p className="text-[13px] font-semibold text-[var(--text)]">공지 상세</p>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)]"
              >
                닫기
              </button>
            </div>

            <div className="max-h-[calc(90vh-52px)] overflow-y-auto px-5 py-4">
              {detailState.loading && (
                <p className="py-6 text-center text-[12px] text-[var(--text-muted)]">
                  공지 상세를 불러오는 중입니다...
                </p>
              )}

              {detailState.error && !detailState.loading && (
                <p className="py-6 text-center text-[12px] text-[var(--status-danger-text)]">
                  {detailState.error}
                </p>
              )}

              {detailState.notice && !detailState.loading && (
                <article>
                  <header className="border-b border-[var(--border-subtle)] pb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--status-warning-text)]">
                      FESTIVAL NOTICE
                    </p>
                    <h2 className="mt-1 text-[15px] font-extrabold leading-snug text-[var(--text)]">
                      {detailState.notice.title}
                    </h2>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span>{detailState.notice.author}</span>
                      <span>{formatDate(detailState.notice.createdAt)}</span>
                    </div>
                  </header>

                  {(detailState.notice.imageUrls?.length ?? 0) > 0 ? (
                    <div className="mt-3">
                      <div
                        className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]"
                        onTouchStart={(e) => {
                          if (e.touches.length === 1) {
                            setDragStartX(e.touches[0].clientX);
                          }
                        }}
                        onTouchEnd={(e) => {
                          if (dragStartX == null || !detailState.notice?.imageUrls) return;
                          const endX = e.changedTouches[0]?.clientX ?? dragStartX;
                          const delta = endX - dragStartX;
                          const threshold = 40;
                          const maxIndex = detailState.notice.imageUrls.length - 1;

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
                          if (dragStartX == null || !detailState.notice?.imageUrls) return;
                          const endX = e.clientX ?? dragStartX;
                          const delta = endX - dragStartX;
                          const threshold = 40;
                          const maxIndex = detailState.notice.imageUrls.length - 1;

                          if (delta <= -threshold && activeImageIndex < maxIndex) {
                            setActiveImageIndex((prev) => Math.min(prev + 1, maxIndex));
                          } else if (delta >= threshold && activeImageIndex > 0) {
                            setActiveImageIndex((prev) => Math.max(prev - 1, 0));
                          }

                          setDragStartX(null);
                        }}
                        onWheel={(e) => {
                          if (!detailState.notice?.imageUrls?.length) return;
                          const dx = e.deltaX;
                          const dy = e.deltaY;
                          if (Math.abs(dx) <= Math.abs(dy)) return; // 세로 스크롤 우선

                          // 트랙패드 좌우 스와이프: deltaX 누적이 일정 이상이면 페이지 이동
                          const threshold = 80;
                          const maxIndex = detailState.notice.imageUrls.length - 1;

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
                          src={detailState.notice.imageUrls?.[activeImageIndex]}
                          alt={detailState.notice.title}
                          className="max-h-60 w-full object-cover"
                        />
                        <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-[var(--admin-dialog-overlay-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-on-accent)]">
                          {activeImageIndex + 1} / {detailState.notice.imageUrls?.length ?? 0}
                        </div>
                      </div>
                      <div className="mt-2 flex justify-center">
                        <div className="flex items-center gap-1">
                          {detailState.notice.imageUrls?.map((_, idx) => (
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
                  ) : detailState.notice.thumbnailImageUrl ? (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--border-subtle)]">
                      <img
                        src={detailState.notice.thumbnailImageUrl}
                        alt={detailState.notice.title}
                        className="max-h-60 w-full object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="mt-4 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--text)]">
                    {detailState.notice.content}
                  </div>
                </article>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notice;
