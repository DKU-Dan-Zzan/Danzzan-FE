import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Bell,
  ImageIcon,
  LogOut,
  Megaphone,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import {
  createAdminNotice,
  deleteAdminNotice,
  getAdminAdUploadUrl,
  getAdminAds,
  getAdminNotices,
  getEmergencyAdminNotice,
  type AdvertisementPlacement,
  type AdvertisementResponse,
  type NoticeResponse,
  toggleAdminAdActive,
  createAdminAd,
  updateAdminAd,
  deleteAdminAd,
  updateAdminNotice,
  updateEmergencyAdminNotice,
} from "../../api/admin";

type NoticeAuthor = "개발팀" | "총학생회";

type NoticeFormState = {
  id?: number;
  title: string;
  content: string;
  author: NoticeAuthor;
  isEmergency: boolean;
  imageUrls: string[];
};

type AdFormState = {
  id?: number;
  title: string;
  imageUrl: string;
  linkUrl: string;
  placement: AdvertisementPlacement;
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: string;
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
  const [noticeImageInput, setNoticeImageInput] = useState("");
  // 광고
  const [ads, setAds] = useState<AdvertisementResponse[]>([]);
  const [adPage, setAdPage] = useState(0);
  const [adTotalPages, setAdTotalPages] = useState(0);
  const [adLoading, setAdLoading] = useState(false);
  const [editingAd, setEditingAd] = useState<AdFormState | null>(null);
  const [uploadingAdImage, setUploadingAdImage] = useState(false);

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
        setAdLoading(true);

        const [emergencyRes, noticePageRes, adPageRes] = await Promise.all([
          getEmergencyAdminNotice(),
          getAdminNotices({ page: 0, size: 10 }),
          getAdminAds({ page: 0, size: 10 }),
        ]);

        setEmergencyMessage(emergencyRes.message ?? "");
        setEmergencyActive(Boolean(emergencyRes.isActive));

        setNotices(noticePageRes.content);
        setNoticePage(noticePageRes.number);
        setNoticeTotalPages(noticePageRes.totalPages);
        setAds(adPageRes.content);
        setAdPage(adPageRes.number);
        setAdTotalPages(adPageRes.totalPages);
      } catch (error) {
        setGlobalError(error instanceof Error ? error.message : "데이터를 불러오지 못했습니다.");
      } finally {
        setEmergencyLoading(false);
        setNoticeLoading(false);
        setAdLoading(false);
        setInitialLoaded(true);
      }
    };

    if (!initialLoaded) {
      void loadInitial();
    }
  }, [initialLoaded]);

  // 공지 재조회
  const reloadNotices = async (page = 0, keyword = noticeKeyword) => {
    try {
      setGlobalError(null);
      setNoticeLoading(true);
      const res = await getAdminNotices({
        page,
        size: 10,
        keyword: keyword.trim() || undefined,
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
  const reloadAds = async (page = 0) => {
    try {
      setGlobalError(null);
      setAdLoading(true);
      const res = await getAdminAds({ page, size: 10 });
      setAds(res.content);
      setAdPage(res.number);
      setAdTotalPages(res.totalPages);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "광고 목록을 불러오지 못했습니다.");
    } finally {
      setAdLoading(false);
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
    () => notices.filter((n) => n.isEmergency),
    [notices],
  );
  const noticeOthers = useMemo(
    () => notices.filter((n) => !n.isEmergency),
    [notices],
  );

  const openNewNotice = () => {
    setEditingNotice({
      title: "",
      content: "",
      author: "개발팀",
      isEmergency: false,
      imageUrls: [],
    });
  };

  const openEditNotice = (notice: NoticeResponse) => {
    setEditingNotice({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      author: (notice.author as NoticeAuthor) || "개발팀",
      isEmergency: notice.isEmergency,
      imageUrls: notice.imageUrls ?? [],
    });
  };

  const handleSubmitNotice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingNotice) return;

    const payload = {
      title: editingNotice.title.trim(),
      content: editingNotice.content.trim(),
      author: editingNotice.author,
      isEmergency: editingNotice.isEmergency,
      imageUrls: editingNotice.imageUrls,
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

  const handleDeleteNotice = async (id: number) => {
    const confirmed = window.confirm("이 공지를 삭제하시겠습니까?");
    if (!confirmed) return;

    try {
      setGlobalError(null);
      await deleteAdminNotice(id);
      await reloadNotices(noticePage);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "공지를 삭제하지 못했습니다.");
    }
  };

  const openNewAd = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = `${today.getMonth() + 1}`.padStart(2, "0");
    const dd = `${today.getDate()}`.padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    setEditingAd({
      title: "",
      imageUrl: "",
      linkUrl: "",
      placement: "HOME",
      startDate: todayStr,
      endDate: todayStr,
      isActive: true,
      priority: "",
    });
  };

  const openEditAd = (ad: AdvertisementResponse) => {
    setEditingAd({
      id: ad.id,
      title: ad.title,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl ?? "",
      placement: (ad.placement as AdvertisementPlacement) || "HOME",
      startDate: ad.startDate,
      endDate: ad.endDate,
      isActive: ad.isActive,
      priority: ad.priority != null ? String(ad.priority) : "",
    });
  };

  const handleSubmitAd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingAd) return;

    const payload = {
      title: editingAd.title.trim(),
      imageUrl: editingAd.imageUrl.trim(),
      linkUrl: editingAd.linkUrl.trim() || null,
      placement: editingAd.placement,
      startDate: editingAd.startDate,
      endDate: editingAd.endDate,
      isActive: editingAd.isActive,
      priority:
        editingAd.priority.trim() === "" ? null : Number.parseInt(editingAd.priority.trim(), 10),
    };

    if (!payload.title || !payload.imageUrl || !payload.startDate || !payload.endDate) {
      setGlobalError("제목, 이미지, 시작일, 종료일을 모두 입력해 주세요.");
      return;
    }

    if (Number.isNaN(payload.priority as number | null | undefined)) {
      setGlobalError("우선순위는 숫자로 입력해 주세요.");
      return;
    }

    try {
      setGlobalError(null);
      if (editingAd.id) {
        await updateAdminAd(editingAd.id, payload);
      } else {
        await createAdminAd(payload);
      }
      setEditingAd(null);
      await reloadAds(adPage);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "광고를 저장하지 못했습니다.");
    }
  };

  const handleDeleteAd = async (id: number) => {
    const confirmed = window.confirm("이 광고를 삭제하시겠습니까?");
    if (!confirmed) return;
    try {
      setGlobalError(null);
      await deleteAdminAd(id);
      await reloadAds(adPage);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "광고를 삭제하지 못했습니다.");
    }
  };

  const handleToggleAdActive = async (ad: AdvertisementResponse) => {
    try {
      setGlobalError(null);
      await toggleAdminAdActive(ad.id, !ad.isActive);
      await reloadAds(adPage);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "광고 상태를 변경하지 못했습니다.");
    }
  };

  const handleUploadAdImage = async (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      window.alert("이미지는 JPG, PNG, WEBP 형식만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.alert("이미지 크기는 최대 5MB까지 업로드할 수 있습니다.");
      return;
    }

    try {
      setUploadingAdImage(true);
      const uploadMeta = await getAdminAdUploadUrl({
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      });

      await fetch(uploadMeta.presignedUrl, {
        method: uploadMeta.method,
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      setEditingAd((prev) => (prev ? { ...prev, imageUrl: uploadMeta.imageUrl } : prev));
      window.alert("이미지 업로드가 완료되었습니다.");
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.");
    } finally {
      setUploadingAdImage(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[var(--bg-base)]">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-3">
        <h1 className="text-lg font-bold text-[var(--text)]">공지 및 광고 관리자 페이지</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--border-base)] hover:text-[var(--text)]"
        >
          <LogOut className="h-4 w-4" strokeWidth={2.3} />
          로그아웃
        </button>
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
                맨 위 고정 공지 1개까지 설정할 수 있습니다.
              </p>
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
                  <th className="px-3 py-2 text-center font-semibold">수정</th>
                  <th className="px-3 py-2 text-center font-semibold">삭제</th>
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
                {noticePinned.map((notice) => (
                  <tr key={notice.id} className="bg-orange-50/60">
                    <td className="px-4 py-2 align-middle">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                          맨 위 고정
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
                      <button
                        type="button"
                        onClick={() => openEditNotice(notice)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:bg-[var(--border-base)]"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2.3} />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => void handleDeleteNotice(notice.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                      </button>
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
                      <button
                        type="button"
                        onClick={() => openEditNotice(notice)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:bg-[var(--border-base)]"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2.3} />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => void handleDeleteNotice(notice.id)}
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
        </section>

        {/* 광고 목록 */}
        <section className="mb-6 rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--text)]">광고 배너 관리</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                각 화면별 노출될 배너를 관리합니다. 기간/활성 여부를 설정해 주세요.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openNewAd}
                className="flex h-9 items-center gap-1 rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-xs font-semibold text-[var(--text)] hover:bg-[var(--border-base)]"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.3} />
                새 광고
              </button>
            </div>
          </header>

          <div className="overflow-hidden rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)]">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2 font-semibold">이미지</th>
                  <th className="px-4 py-2 font-semibold">제목 / 링크</th>
                  <th className="px-4 py-2 font-semibold">위치</th>
                  <th className="px-4 py-2 font-semibold">기간</th>
                  <th className="px-4 py-2 font-semibold">활성</th>
                  <th className="px-3 py-2 text-center font-semibold">수정</th>
                  <th className="px-3 py-2 text-center font-semibold">삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-base)] bg-white">
                {adLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-[var(--text-muted)]">
                      광고 목록을 불러오는 중입니다...
                    </td>
                  </tr>
                )}
                {!adLoading && ads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-[var(--text-muted)]">
                      등록된 광고가 없습니다.
                    </td>
                  </tr>
                )}
                {ads.map((ad) => (
                  <tr key={ad.id}>
                    <td className="px-4 py-2">
                      {ad.imageUrl ? (
                        <img
                          src={ad.imageUrl}
                          alt={ad.title}
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
                        <span className="text-sm text-[var(--text)]">{ad.title}</span>
                        {ad.linkUrl && (
                          <span className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                            {ad.linkUrl}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">
                      {ad.placement}
                    </td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">
                      {formatDate(ad.startDate)} ~ {formatDate(ad.endDate)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          ad.isActive
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {ad.isActive ? "활성" : "비활성"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAdActive(ad)}
                        className="inline-flex h-7 items-center justify-center rounded-full border px-3 text-[10px] font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]"
                      >
                        {ad.isActive ? "비활성" : "활성"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => openEditAd(ad)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:bg-[var(--border-base)]"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2.3} />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => void handleDeleteAd(ad.id)}
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

          {adTotalPages > 1 && (
            <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-[var(--text-muted)]">
              <button
                type="button"
                disabled={adPage === 0}
                onClick={() => void reloadAds(adPage - 1)}
                className="rounded-full border border-[var(--border-base)] bg-[var(--surface-subtle)] px-2 py-1 disabled:opacity-50"
              >
                이전
              </button>
              <span>
                {adPage + 1} / {adTotalPages}
              </span>
              <button
                type="button"
                disabled={adPage + 1 >= adTotalPages}
                onClick={() => void reloadAds(adPage + 1)}
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
                  이미지 업로드 영역
                </label>
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-6 text-center">
                  <UploadCloud className="h-8 w-8 text-[var(--text-muted)]" strokeWidth={2.3} />
                  <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">
                    이미지를 업로드하세요
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    (PNG, JPG / S3 연동 예정)
                  </p>
                  <div className="mt-3 flex w-full max-w-sm gap-2">
                    <input
                      type="url"
                      value={noticeImageInput}
                      onChange={(e) => setNoticeImageInput(e.target.value)}
                      placeholder="이미지 URL을 입력해 주세요"
                      className="h-9 flex-1 rounded-2xl border border-[var(--border-base)] bg-white px-3 text-xs focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = noticeImageInput.trim();
                        if (!url) return;
                        setEditingNotice((prev) =>
                          prev ? { ...prev, imageUrls: [...prev.imageUrls, url] } : prev,
                        );
                        setNoticeImageInput("");
                      }}
                      className="h-9 rounded-2xl bg-[var(--accent)] px-3 text-xs font-semibold text-white shadow-sm hover:brightness-95"
                    >
                      추가
                    </button>
                  </div>
                  {editingNotice.imageUrls.length > 0 && (
                    <div className="mt-4 flex w-full max-w-sm flex-wrap gap-2">
                      {editingNotice.imageUrls.map((url, index) => (
                        <div
                          key={`${url}-${index}`}
                          className="group relative h-16 w-16 overflow-hidden rounded-xl border border-[var(--border-base)] bg-white"
                        >
                          <img
                            src={url}
                            alt={`공지 이미지 ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setEditingNotice((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
                                    }
                                  : prev,
                              )
                            }
                            className="absolute right-1 top-1 hidden rounded-full bg-black/60 px-1.5 text-[10px] font-semibold text-white group-hover:inline"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
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
                    checked={editingNotice.isEmergency}
                    onChange={(e) =>
                      setEditingNotice((prev) =>
                        prev ? { ...prev, isEmergency: e.target.checked } : prev,
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

      {/* 광고 작성/수정 모달 */}
      {editingAd && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-sm font-bold text-[var(--text)]">
              {editingAd.id ? "광고 수정" : "새 광고 등록"}
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_minmax(0,1fr)]">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--text)]">
                    이미지 업로드 (최대 5MB)
                  </label>
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-4 text-center">
                    <ImageIcon className="h-7 w-7 text-[var(--text-muted)]" strokeWidth={2.3} />
                    <p className="mt-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
                      JPG, PNG, WEBP 이미지를 업로드하세요
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      업로드 후 자동으로 S3 URL이 입력됩니다.
                    </p>
                    <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-2xl bg-[var(--accent)] px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:brightness-95">
                      <UploadCloud className="mr-1 h-3.5 w-3.5" strokeWidth={2.3} />
                      {uploadingAdImage ? "업로드 중..." : "파일 선택"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingAdImage}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void handleUploadAdImage(file);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                    {editingAd.imageUrl && (
                      <p className="mt-2 truncate text-[10px] text-[var(--text-muted)]">
                        {editingAd.imageUrl}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--text)]">링크 URL (선택)</label>
                  <input
                    type="url"
                    value={editingAd.linkUrl}
                    onChange={(e) =>
                      setEditingAd((prev) => (prev ? { ...prev, linkUrl: e.target.value } : prev))
                    }
                    className="h-9 w-full rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-xs focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
                    placeholder="https://example.com"
                  />

                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-[var(--text)]">노출 위치</span>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {(["HOME", "BOOTH_LIST", "MAP", "TICKET", "GLOBAL"] as AdvertisementPlacement[]).map(
                        (placement) => (
                          <button
                            key={placement}
                            type="button"
                            onClick={() =>
                              setEditingAd((prev) =>
                                prev ? { ...prev, placement } : prev,
                              )
                            }
                            className={`rounded-full px-3 py-1 font-semibold ${
                              editingAd.placement === placement
                                ? "bg-[var(--accent)] text-white"
                                : "bg-[var(--surface-subtle)] text-[var(--text-muted)]"
                            }`}
                          >
                            {placement === "HOME" && "홈"}
                            {placement === "BOOTH_LIST" && "부스 목록"}
                            {placement === "MAP" && "지도"}
                            {placement === "TICKET" && "티켓"}
                            {placement === "GLOBAL" && "공통(GLOBAL)"}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-[var(--text)]">노출 기간</span>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={editingAd.startDate}
                        onChange={(e) =>
                          setEditingAd((prev) =>
                            prev ? { ...prev, startDate: e.target.value } : prev,
                          )
                        }
                        className="h-9 flex-1 rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-xs focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
                        required
                      />
                      <span className="self-center text-[11px] text-[var(--text-muted)]">~</span>
                      <input
                        type="date"
                        value={editingAd.endDate}
                        onChange={(e) =>
                          setEditingAd((prev) =>
                            prev ? { ...prev, endDate: e.target.value } : prev,
                          )
                        }
                        className="h-9 flex-1 rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-xs focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text)]">
                        우선순위 (선택)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={editingAd.priority}
                        onChange={(e) =>
                          setEditingAd((prev) =>
                            prev ? { ...prev, priority: e.target.value } : prev,
                          )
                        }
                        className="h-9 w-24 rounded-2xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 text-xs focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
                        placeholder="예: 10"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
                      <input
                        type="checkbox"
                        checked={editingAd.isActive}
                        onChange={(e) =>
                          setEditingAd((prev) =>
                            prev ? { ...prev, isActive: e.target.checked } : prev,
                          )
                        }
                        className="h-4 w-4 rounded border-[var(--border-base)] text-[var(--accent)] focus:ring-[var(--accent)]"
                      />
                      현재 활성화
                    </label>
                  </div>
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
                  className="rounded-2xl bg-[var(--accent)] px-4 py-2 font-semibold text-white shadow-sm hover:brightness-95"
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
