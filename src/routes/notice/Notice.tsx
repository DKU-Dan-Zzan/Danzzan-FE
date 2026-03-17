import { useEffect, useMemo, useState } from "react";
import { getNoticeDetail, getNotices, type NoticeDto } from "../../api/noticeApi";

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

function Notice() {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<CategoryKey>("ALL");
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
  };

  const handleChangePage = (nextPage: number) => {
    if (nextPage < 0 || nextPage >= pageState.totalPages) return;
    setPageState((prev) => ({ ...prev, page: nextPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="pb-5">
      {/* 상단 타이틀 & 검색 */}
      <section className="bg-white px-4 pb-4 pt-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
        <div className="mb-3">
          <p className="text-[11px] font-semibold text-[#2563EB]">단짠 공지사항</p>
          <h1 className="mt-1 text-[20px] font-extrabold tracking-tight text-[#0F172A]">
            축제 소식 한눈에 보기
          </h1>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 rounded-full bg-[#F3F4F6] px-4 py-2 shadow-inner">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="공지 제목 또는 내용을 검색해 보세요"
              className="h-7 w-full bg-transparent text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* 목록 영역 */}
      <section className="mt-3 px-4">
        {pageState.error && (
          <div className="mb-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-[12px] text-red-600">
            {pageState.error}
          </div>
        )}

        {pageState.loading && (pageState.notices ?? []).length === 0 && (
          <p className="py-8 text-center text-[12px] text-gray-400">공지사항을 불러오는 중입니다...</p>
        )}

        {!pageState.loading &&
          !pageState.error &&
          (noticePinned ?? []).length === 0 &&
          (noticeOthers ?? []).length === 0 && (
            <p className="py-8 text-center text-[12px] text-gray-400">
              아직 등록된 공지사항이 없습니다.
            </p>
          )}

        <div className="space-y-2.5">
          {noticePinned.map((notice) => (
            <button
              key={notice.id}
              type="button"
              onClick={() => void handleOpenDetail(notice.id)}
              className="group flex w-full items-center justify-between rounded-[18px] border border-[#E5EDFF] bg-white px-4 py-3 text-left shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition-transform active:scale-[0.99]"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#E0EBFF] text-[11px] font-semibold text-[#2563EB]">
                  ★
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#111827]">
                    {notice.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-[#6B7280]">{notice.content}</p>
                </div>
              </div>
              <span className="ml-2 flex-shrink-0 text-[11px] text-[#9CA3AF]">
                {formatDate(notice.createdAt)}
              </span>
            </button>
          ))}

          {noticeOthers.map((notice) => (
            <button
              key={notice.id}
              type="button"
              onClick={() => void handleOpenDetail(notice.id)}
              className="group flex w-full items-center justify-between rounded-[18px] border border-[#E5E7EB] bg-white px-4 py-3 text-left shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition-transform active:scale-[0.99]"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[11px] font-semibold text-[#6B7280]">
                  {notice.category === "EVENT" ? "이벤트" : "일반"}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#111827]">
                    {notice.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-[#6B7280]">{notice.content}</p>
                </div>
              </div>
              <span className="ml-2 flex-shrink-0 text-[11px] text-[#9CA3AF]">
                {formatDate(notice.createdAt)}
              </span>
            </button>
          ))}
        </div>

        {pageState.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-[#6B7280]">
            <button
              type="button"
              disabled={pageState.page === 0}
              onClick={() => handleChangePage(pageState.page - 1)}
              className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1 disabled:opacity-50"
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
              className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1 disabled:opacity-50"
            >
              다음
            </button>
          </div>
        )}
      </section>

      {/* 상세 보기 패널 */}
      {(detailState.notice || detailState.loading || detailState.error) && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-[0_18px_45px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-3.5">
              <p className="text-[13px] font-semibold text-[#111827]">공지 상세</p>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-semibold text-[#4B5563]"
              >
                닫기
              </button>
            </div>

            <div className="max-h-[calc(90vh-52px)] overflow-y-auto px-5 py-4">
              {detailState.loading && (
                <p className="py-6 text-center text-[12px] text-gray-400">
                  공지 상세를 불러오는 중입니다...
                </p>
              )}

              {detailState.error && !detailState.loading && (
                <p className="py-6 text-center text-[12px] text-red-600">
                  {detailState.error}
                </p>
              )}

              {detailState.notice && !detailState.loading && (
                <article>
                  <header className="border-b border-[#E5E7EB] pb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F97316]">
                      FESTIVAL NOTICE
                    </p>
                    <h2 className="mt-1 text-[15px] font-extrabold leading-snug text-[#111827]">
                      {detailState.notice.title}
                    </h2>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-[#9CA3AF]">
                      <span>{detailState.notice.author}</span>
                      <span>{formatDate(detailState.notice.createdAt)}</span>
                    </div>
                  </header>

                  {detailState.notice.thumbnailImageUrl && (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-[#E5E7EB]">
                      <img
                        src={detailState.notice.thumbnailImageUrl}
                        alt={detailState.notice.title}
                        className="max-h-60 w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="mt-4 whitespace-pre-wrap text-[13px] leading-relaxed text-[#111827]">
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