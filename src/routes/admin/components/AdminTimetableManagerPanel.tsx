// 역할: /admin/map의 Timetable 탭에서 공연 일정과 아티스트를 관리하는 패널.
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { Pencil, Plus, RefreshCcw, Save, Trash2, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  createAdminArtist,
  createAdminPerformance,
  deleteAdminArtist,
  deleteAdminPerformance,
  getAdminArtistImagePresign,
  getAdminArtists,
  getAdminPerformancesByDate,
  updateAdminArtist,
  updateAdminPerformance,
  type AdminArtist,
  type AdminPerformance,
} from "@/api/app/admin/adminTimetableApi";
import { getAdminMap, updateComingSoonOverlayEnabled } from "@/api/app/admin/adminMapApi";
import { AdminShell } from "@/components/layout/AdminShell";
import { Switch } from "@/components/common/ui/switch";
import { cn } from "@/components/common/ui/utils";
import { FESTIVAL_DAYS } from "@/config/festivalDays";
import {
  createUploadFailureMessage,
  uploadToPresignedUrl,
  validateImageFile,
} from "@/routes/admin/adminEditorLogic";

type PerformanceFormState = {
  performanceId: number | null;
  artistId: number | "";
  performanceDate: string;
  startTime: string;
  endTime: string;
  stage: string;
};

type ArtistFormState = {
  artistId: number | null;
  name: string;
  description: string;
  imageUrl: string;
};

type ArtistImageDraft = {
  file: File;
  previewUrl: string;
};

const HHMM_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const buildEmptyPerformanceForm = (date: string): PerformanceFormState => ({
  performanceId: null,
  artistId: "",
  performanceDate: date,
  startTime: "",
  endTime: "",
  stage: "",
});

const performanceToForm = (performance: AdminPerformance): PerformanceFormState => ({
  performanceId: performance.performanceId,
  artistId: performance.artistId,
  performanceDate: performance.performanceDate,
  startTime: performance.startTime,
  endTime: performance.endTime,
  stage: performance.stage ?? "",
});

const buildEmptyArtistForm = (): ArtistFormState => ({
  artistId: null,
  name: "",
  description: "",
  imageUrl: "",
});

const artistToForm = (artist: AdminArtist): ArtistFormState => ({
  artistId: artist.artistId,
  name: artist.name,
  description: artist.description ?? "",
  imageUrl: artist.imageUrl ?? "",
});

const isValidTime = (value: string) => HHMM_PATTERN.test(value);

export default function AdminTimetableManagerPanel({
  topSlot,
}: {
  topSlot?: ReactNode;
}) {
  const navigate = useNavigate();
  const [activeDayKey, setActiveDayKey] = useState<string>(FESTIVAL_DAYS[0].key);
  const activeDay = useMemo(
    () => FESTIVAL_DAYS.find((day) => day.key === activeDayKey) ?? FESTIVAL_DAYS[0],
    [activeDayKey],
  );

  const [performances, setPerformances] = useState<AdminPerformance[]>([]);
  const [performancesLoading, setPerformancesLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [comingSoonOverlayEnabled, setComingSoonOverlayEnabled] = useState(false);
  const [comingSoonOverlaySaving, setComingSoonOverlaySaving] = useState(false);

  const [artists, setArtists] = useState<AdminArtist[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);

  const [performanceForm, setPerformanceForm] = useState<PerformanceFormState>(
    () => buildEmptyPerformanceForm(activeDay.date),
  );
  const [savingPerformance, setSavingPerformance] = useState(false);

  const [artistForm, setArtistForm] = useState<ArtistFormState>(buildEmptyArtistForm());
  const [savingArtist, setSavingArtist] = useState(false);
  const [artistImageDraft, setArtistImageDraft] = useState<ArtistImageDraft | null>(null);
  const [artistImageError, setArtistImageError] = useState<string | null>(null);

  const isEditingPerformance = performanceForm.performanceId !== null;
  const isEditingArtist = artistForm.artistId !== null;

  useEffect(() => {
    setPerformanceForm((prev) =>
      prev.performanceId === null
        ? { ...prev, performanceDate: activeDay.date }
        : prev,
    );
  }, [activeDay.date]);

  useEffect(() => {
    return () => {
      if (artistImageDraft) {
        URL.revokeObjectURL(artistImageDraft.previewUrl);
      }
    };
  }, [artistImageDraft]);

  const loadPerformances = async (date: string) => {
    try {
      setPerformancesLoading(true);
      setGlobalError(null);
      const response = await getAdminPerformancesByDate(date);
      setPerformances(response.performances);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "공연 목록을 불러오지 못했습니다.";
      setGlobalError(message);
      toast.error(message);
    } finally {
      setPerformancesLoading(false);
    }
  };

  const loadArtists = async () => {
    try {
      setArtistsLoading(true);
      const response = await getAdminArtists();
      setArtists(response);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "아티스트 목록을 불러오지 못했습니다.";
      setGlobalError(message);
      toast.error(message);
    } finally {
      setArtistsLoading(false);
    }
  };

  useEffect(() => {
    void loadPerformances(activeDay.date);
  }, [activeDay.date]);

  useEffect(() => {
    void loadArtists();
  }, []);

  const loadComingSoonOverlayState = async (date: string) => {
    try {
      const response = await getAdminMap(date);
      setComingSoonOverlayEnabled(Boolean(response.comingSoonOverlayEnabled));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "타임테이블 Coming Soon 설정을 불러오지 못했습니다.";
      setGlobalError(message);
      toast.error(message);
    }
  };

  useEffect(() => {
    void loadComingSoonOverlayState(activeDay.date);
  }, [activeDay.date]);

  const handleChangeDay = (dayKey: string) => {
    setActiveDayKey(dayKey);
    const targetDay = FESTIVAL_DAYS.find((d) => d.key === dayKey);
    if (targetDay) {
      setPerformanceForm(buildEmptyPerformanceForm(targetDay.date));
    }
  };

  const validatePerformanceForm = (
    form: PerformanceFormState,
  ): string | null => {
    if (form.artistId === "" || form.artistId === null) {
      return "아티스트를 선택해 주세요.";
    }
    if (!form.performanceDate) {
      return "공연 날짜를 선택해 주세요.";
    }
    if (!isValidTime(form.startTime) || !isValidTime(form.endTime)) {
      return "시작/종료 시간을 HH:mm 형식으로 입력해 주세요.";
    }
    if (form.startTime >= form.endTime) {
      return "시작 시간은 종료 시간보다 빨라야 합니다.";
    }
    return null;
  };

  const handleSubmitPerformance = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationMessage = validatePerformanceForm(performanceForm);
    if (validationMessage) {
      toast.warning(validationMessage);
      return;
    }
    if (performanceForm.artistId === "") {
      return;
    }

    const stageValue = performanceForm.stage.trim();
    try {
      setSavingPerformance(true);
      setGlobalError(null);

      if (performanceForm.performanceId === null) {
        await createAdminPerformance({
          artistId: performanceForm.artistId,
          performanceDate: performanceForm.performanceDate,
          startTime: performanceForm.startTime,
          endTime: performanceForm.endTime,
          stage: stageValue || null,
        });
        toast.success("공연을 추가했습니다.");
      } else {
        await updateAdminPerformance(performanceForm.performanceId, {
          artistId: performanceForm.artistId,
          performanceDate: performanceForm.performanceDate,
          startTime: performanceForm.startTime,
          endTime: performanceForm.endTime,
          stage: stageValue,
        });
        toast.success("공연 정보를 수정했습니다.");
      }

      setPerformanceForm(buildEmptyPerformanceForm(performanceForm.performanceDate));
      await loadPerformances(activeDay.date);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "공연 저장에 실패했습니다.";
      setGlobalError(message);
      toast.error(message);
    } finally {
      setSavingPerformance(false);
    }
  };

  const handleEditPerformance = (performance: AdminPerformance) => {
    setPerformanceForm(performanceToForm(performance));
  };

  const handleCancelPerformanceEdit = () => {
    setPerformanceForm(buildEmptyPerformanceForm(activeDay.date));
  };

  const handleDeletePerformance = async (performance: AdminPerformance) => {
    if (
      !window.confirm(
        `${performance.startTime}~${performance.endTime} ${performance.artistName} 공연을 삭제하시겠습니까?`,
      )
    ) {
      return;
    }

    try {
      setGlobalError(null);
      await deleteAdminPerformance(performance.performanceId);
      toast.success("공연을 삭제했습니다.");
      if (performanceForm.performanceId === performance.performanceId) {
        setPerformanceForm(buildEmptyPerformanceForm(activeDay.date));
      }
      await loadPerformances(activeDay.date);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "공연 삭제에 실패했습니다.";
      setGlobalError(message);
      toast.error(message);
    }
  };

  const handleSelectArtistImage = (event: ChangeEvent<HTMLInputElement>) => {
    setArtistImageError(null);
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) {
      return;
    }
    const validationMessage = validateImageFile(file);
    if (validationMessage) {
      setArtistImageError(validationMessage);
      return;
    }
    setArtistImageDraft((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous.previewUrl);
      }
      return {
        file,
        previewUrl: URL.createObjectURL(file),
      };
    });
  };

  const handleClearArtistImageDraft = () => {
    setArtistImageDraft((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous.previewUrl);
      }
      return null;
    });
    setArtistImageError(null);
  };

  const uploadArtistImage = async (artistId: number, file: File): Promise<string> => {
    const presigned = await getAdminArtistImagePresign(artistId, {
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    });
    const uploadResponse = await uploadToPresignedUrl(presigned, file);
    if (!uploadResponse.ok) {
      const message = await createUploadFailureMessage(
        "아티스트 이미지 업로드 실패",
        uploadResponse,
      );
      throw new Error(message);
    }
    return presigned.fileUrl;
  };

  const validateArtistForm = (form: ArtistFormState): string | null => {
    if (!form.name.trim()) {
      return "아티스트 이름을 입력해 주세요.";
    }
    return null;
  };

  const handleSubmitArtist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationMessage = validateArtistForm(artistForm);
    if (validationMessage) {
      toast.warning(validationMessage);
      return;
    }

    try {
      setSavingArtist(true);
      setGlobalError(null);
      setArtistImageError(null);

      const trimmedName = artistForm.name.trim();
      const trimmedDescription = artistForm.description.trim();
      const draftFile = artistImageDraft?.file ?? null;

      let savedArtistId: number;
      if (artistForm.artistId === null) {
        const created = await createAdminArtist({
          name: trimmedName,
          description: trimmedDescription || null,
        });
        savedArtistId = created.artistId;
      } else {
        savedArtistId = artistForm.artistId;
        await updateAdminArtist(savedArtistId, {
          name: trimmedName,
          description: trimmedDescription,
        });
      }

      if (draftFile) {
        try {
          const uploadedUrl = await uploadArtistImage(savedArtistId, draftFile);
          await updateAdminArtist(savedArtistId, { imageUrl: uploadedUrl });
        } catch (uploadError) {
          const message =
            uploadError instanceof Error
              ? uploadError.message
              : "아티스트 이미지 업로드에 실패했습니다.";
          setArtistImageError(message);
          toast.error(message);
        }
      }

      handleClearArtistImageDraft();
      setArtistForm(buildEmptyArtistForm());
      toast.success(
        artistForm.artistId === null
          ? "아티스트를 추가했습니다."
          : "아티스트 정보를 수정했습니다.",
      );
      await loadArtists();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "아티스트 저장에 실패했습니다.";
      setGlobalError(message);
      toast.error(message);
    } finally {
      setSavingArtist(false);
    }
  };

  const handleEditArtist = (artist: AdminArtist) => {
    handleClearArtistImageDraft();
    setArtistForm(artistToForm(artist));
  };

  const handleCancelArtistEdit = () => {
    handleClearArtistImageDraft();
    setArtistForm(buildEmptyArtistForm());
  };

  const handleToggleComingSoonOverlay = async (enabled: boolean) => {
    const previous = comingSoonOverlayEnabled;
    setComingSoonOverlayEnabled(enabled);

    try {
      setComingSoonOverlaySaving(true);
      setGlobalError(null);
      await updateComingSoonOverlayEnabled(enabled);
      toast.success(
        enabled
          ? "타임테이블 Coming Soon 오버레이를 표시하도록 변경했습니다."
          : "타임테이블 Coming Soon 오버레이를 숨기도록 변경했습니다.",
      );
    } catch (error) {
      setComingSoonOverlayEnabled(previous);
      const message =
        error instanceof Error
          ? error.message
          : "타임테이블 Coming Soon 오버레이 설정을 저장하지 못했습니다.";
      setGlobalError(message);
      toast.error(message);
    } finally {
      setComingSoonOverlaySaving(false);
    }
  };

  const handleDeleteArtist = async (artist: AdminArtist) => {
    if (!window.confirm(`'${artist.name}' 아티스트를 삭제하시겠습니까?`)) {
      return;
    }
    try {
      setGlobalError(null);
      await deleteAdminArtist(artist.artistId);
      toast.success("아티스트를 삭제했습니다.");
      if (artistForm.artistId === artist.artistId) {
        handleCancelArtistEdit();
      }
      if (performanceForm.artistId === artist.artistId) {
        setPerformanceForm((prev) => ({ ...prev, artistId: "" }));
      }
      await loadArtists();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "아티스트 삭제에 실패했습니다.";
      setGlobalError(message);
      toast.error(message);
    }
  };

  return (
    <AdminShell
      title="개발자 전용 관리자 페이지"
      eyebrow="DEVELOPER ADMIN"
      headerClassName="sticky top-0 z-20 border-b border-[var(--border-base)] bg-[var(--admin-header-bg)]"
      mainClassName="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-6 py-6"
      actions={
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="rounded-xl border border-[var(--border-base)] bg-white px-3 py-2 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-subtle)]"
        >
          관리자 홈
        </button>
      }
    >
      {topSlot}

      {globalError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      <section className="rounded-3xl border border-[var(--border-base)] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">타임테이블 Coming Soon</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              타임테이블 날짜 3개 영역 전체를 반투명 레이어로 덮고 중앙 문구를 노출합니다.
            </p>
          </div>

          <Switch
            checked={comingSoonOverlayEnabled}
            disabled={comingSoonOverlaySaving}
            aria-label="타임테이블 Coming Soon 오버레이 토글"
            onCheckedChange={(enabled) => {
              void handleToggleComingSoonOverlay(enabled);
            }}
          />
        </div>

        <div className="mt-3 rounded-2xl bg-[var(--surface-subtle)] px-3 py-3 text-xs leading-5 text-[var(--text-muted)]">
          {comingSoonOverlaySaving
            ? "설정을 저장하는 중입니다."
            : comingSoonOverlayEnabled
              ? "현재 사용자 타임테이블 화면에 Coming Soon 오버레이가 표시됩니다."
              : "현재 사용자 타임테이블 화면에는 Coming Soon 오버레이가 꺼져 있습니다."}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-[var(--border-base)] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text)]">공연 타임테이블</h2>
          <button
            type="button"
            onClick={() => void loadPerformances(activeDay.date)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-base)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-subtle)]"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            새로고침
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {FESTIVAL_DAYS.map((day) => (
            <button
              key={day.key}
              type="button"
              onClick={() => handleChangeDay(day.key)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                activeDayKey === day.key
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--border-base)] bg-white text-[var(--text)] hover:bg-[var(--surface-subtle)]",
              )}
            >
              <span className="font-bold">{day.key}</span>
              <span className="ml-2 text-xs opacity-80">{day.date}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-soft)]">
              {activeDay.label} ({activeDay.date}) 공연 목록
            </h3>
            <div className="overflow-hidden rounded-xl border border-[var(--border-base)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-subtle)] text-left text-xs font-semibold text-[var(--text-soft)]">
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">날짜</th>
                    <th className="px-3 py-2">시간</th>
                    <th className="px-3 py-2">아티스트</th>
                    <th className="px-3 py-2">스테이지</th>
                    <th className="px-3 py-2 text-right">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {performancesLoading ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-[var(--text-soft)]">
                        공연 목록을 불러오는 중입니다…
                      </td>
                    </tr>
                  ) : performances.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-[var(--text-soft)]">
                        등록된 공연이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    performances.map((performance) => {
                      const isSelected =
                        performanceForm.performanceId === performance.performanceId;
                      return (
                        <tr
                          key={performance.performanceId}
                          className={cn(
                            "border-t border-[var(--border-base)]",
                            isSelected && "bg-[var(--surface-subtle)]",
                          )}
                        >
                          <td className="px-3 py-2 text-xs text-[var(--text-soft)]">
                            #{performance.performanceId}
                          </td>
                          <td className="px-3 py-2 text-xs">{performance.performanceDate}</td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {performance.startTime} – {performance.endTime}
                          </td>
                          <td className="px-3 py-2 font-medium">{performance.artistName}</td>
                          <td className="px-3 py-2 text-xs">{performance.stage ?? "-"}</td>
                          <td aria-label="공연 관리" className="px-3 py-2 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditPerformance(performance)}
                                className="inline-flex items-center gap-1 rounded-md border border-[var(--border-base)] bg-white px-2 py-1 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-subtle)]"
                              >
                                <Pencil className="h-3 w-3" />
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeletePerformance(performance)}
                                className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <form
            onSubmit={handleSubmitPerformance}
            className="flex flex-col gap-3 rounded-xl border border-[var(--border-base)] bg-[var(--surface-subtle)] p-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text)]">
                {isEditingPerformance ? "공연 수정" : "공연 추가"}
              </h3>
              {isEditingPerformance && (
                <button
                  type="button"
                  onClick={handleCancelPerformanceEdit}
                  className="text-xs font-semibold text-[var(--text-soft)] hover:underline"
                >
                  취소
                </button>
              )}
            </div>

            <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-soft)]">
              아티스트
              <select
                value={performanceForm.artistId === "" ? "" : String(performanceForm.artistId)}
                onChange={(event) =>
                  setPerformanceForm((prev) => ({
                    ...prev,
                    artistId: event.target.value === "" ? "" : Number(event.target.value),
                  }))
                }
                className="rounded-md border border-[var(--border-base)] bg-white px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="">아티스트를 선택해 주세요</option>
                {artists.map((artist) => (
                  <option key={artist.artistId} value={artist.artistId}>
                    {artist.name}
                  </option>
                ))}
              </select>
              {artists.length === 0 && !artistsLoading && (
                <span className="text-[11px] font-normal text-[var(--text-soft)]">
                  먼저 아래에서 아티스트를 등록해 주세요.
                </span>
              )}
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-soft)]">
              공연 날짜
              <input
                type="date"
                value={performanceForm.performanceDate}
                onChange={(event) =>
                  setPerformanceForm((prev) => ({
                    ...prev,
                    performanceDate: event.target.value,
                  }))
                }
                className="rounded-md border border-[var(--border-base)] bg-white px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <span className="text-[11px] font-normal text-[var(--text-soft)]">
                현재 선택된 {activeDay.label}({activeDay.date})에 자동으로 맞춰집니다.
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-soft)]">
                시작 시간
                <input
                  type="time"
                  value={performanceForm.startTime}
                  onChange={(event) =>
                    setPerformanceForm((prev) => ({
                      ...prev,
                      startTime: event.target.value,
                    }))
                  }
                  className="rounded-md border border-[var(--border-base)] bg-white px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-soft)]">
                종료 시간
                <input
                  type="time"
                  value={performanceForm.endTime}
                  onChange={(event) =>
                    setPerformanceForm((prev) => ({
                      ...prev,
                      endTime: event.target.value,
                    }))
                  }
                  className="rounded-md border border-[var(--border-base)] bg-white px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-soft)]">
              스테이지
              <input
                type="text"
                value={performanceForm.stage}
                onChange={(event) =>
                  setPerformanceForm((prev) => ({ ...prev, stage: event.target.value }))
                }
                placeholder="예: MAIN_STAGE"
                className="rounded-md border border-[var(--border-base)] bg-white px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </label>

            <button
              type="submit"
              disabled={savingPerformance}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEditingPerformance ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {savingPerformance
                ? "저장 중…"
                : isEditingPerformance
                ? "변경사항 저장"
                : "공연 추가"}
            </button>
          </form>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-[var(--border-base)] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text)]">아티스트 관리</h2>
          <button
            type="button"
            onClick={() => void loadArtists()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-base)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-subtle)]"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            새로고침
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-soft)]">아티스트 목록</h3>
            <div className="overflow-hidden rounded-xl border border-[var(--border-base)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-subtle)] text-left text-xs font-semibold text-[var(--text-soft)]">
                  <tr>
                    <th className="px-3 py-2">이미지</th>
                    <th className="px-3 py-2">이름</th>
                    <th className="px-3 py-2">설명</th>
                    <th className="px-3 py-2 text-right">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {artistsLoading ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-[var(--text-soft)]">
                        아티스트를 불러오는 중입니다…
                      </td>
                    </tr>
                  ) : artists.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-[var(--text-soft)]">
                        등록된 아티스트가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    artists.map((artist) => {
                      const isSelected = artistForm.artistId === artist.artistId;
                      return (
                        <tr
                          key={artist.artistId}
                          className={cn(
                            "border-t border-[var(--border-base)]",
                            isSelected && "bg-[var(--surface-subtle)]",
                          )}
                        >
                          <td className="px-3 py-2">
                            {artist.imageUrl ? (
                              <img
                                src={artist.imageUrl}
                                alt={artist.name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-[var(--surface-subtle)]" />
                            )}
                          </td>
                          <td className="px-3 py-2 font-medium">{artist.name}</td>
                          <td className="px-3 py-2 text-xs text-[var(--text-soft)]">
                            {artist.description ?? "-"}
                          </td>
                          <td aria-label="아티스트 관리" className="px-3 py-2 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditArtist(artist)}
                                className="inline-flex items-center gap-1 rounded-md border border-[var(--border-base)] bg-white px-2 py-1 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-subtle)]"
                              >
                                <Pencil className="h-3 w-3" />
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteArtist(artist)}
                                className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <form
            onSubmit={handleSubmitArtist}
            className="flex flex-col gap-3 rounded-xl border border-[var(--border-base)] bg-[var(--surface-subtle)] p-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text)]">
                {isEditingArtist ? "아티스트 수정" : "아티스트 추가"}
              </h3>
              {isEditingArtist && (
                <button
                  type="button"
                  onClick={handleCancelArtistEdit}
                  className="text-xs font-semibold text-[var(--text-soft)] hover:underline"
                >
                  취소
                </button>
              )}
            </div>

            <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-soft)]">
              이름
              <input
                type="text"
                value={artistForm.name}
                onChange={(event) =>
                  setArtistForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="아티스트 이름"
                className="rounded-md border border-[var(--border-base)] bg-white px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-soft)]">
              설명
              <textarea
                value={artistForm.description}
                onChange={(event) =>
                  setArtistForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="아티스트 한 줄 소개 등"
                rows={3}
                className="rounded-md border border-[var(--border-base)] bg-white px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </label>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-[var(--text-soft)]">아티스트 이미지</span>
              <div className="flex items-start gap-3">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--border-base)] bg-white">
                  {artistImageDraft ? (
                    <img
                      src={artistImageDraft.previewUrl}
                      alt="새 이미지 미리보기"
                      className="h-full w-full object-cover"
                    />
                  ) : artistForm.imageUrl ? (
                    <img
                      src={artistForm.imageUrl}
                      alt={artistForm.name || "아티스트 이미지"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[11px] text-[var(--text-soft)]">미등록</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-md border border-[var(--border-base)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-subtle)]">
                    <Upload className="h-3.5 w-3.5" />
                    {artistForm.imageUrl || artistImageDraft ? "이미지 변경" : "이미지 업로드"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleSelectArtistImage}
                      className="hidden"
                    />
                  </label>
                  {artistImageDraft && (
                    <button
                      type="button"
                      onClick={handleClearArtistImageDraft}
                      className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-[var(--text-soft)] hover:underline"
                    >
                      <X className="h-3 w-3" />
                      선택한 이미지 제거
                    </button>
                  )}
                  <p className="text-[11px] text-[var(--text-soft)]">
                    JPG · PNG · WEBP, 최대 5MB. 저장 시 NHN/S3에 업로드됩니다.
                  </p>
                  {artistImageError && (
                    <p className="text-[11px] font-semibold text-red-600">{artistImageError}</p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingArtist}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEditingArtist ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {savingArtist
                ? "저장 중…"
                : isEditingArtist
                ? "변경사항 저장"
                : "아티스트 추가"}
            </button>
          </form>
        </div>
      </section>
    </AdminShell>
  );
}
