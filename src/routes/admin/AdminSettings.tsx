// 역할: 관리자 콘솔의 기본 페이지. 축제 이름/운영 날짜/티켓팅 회차 등 축제 운영 정보를 등록한다.
//
// 여기서 저장한 운영 날짜가 부스맵·타임테이블의 날짜 탭이 된다.
// 저장에 성공하면 앱 전체가 쓰는 날짜 저장소(festivalCalendar)도 함께 갱신한다.
import { useEffect, useMemo, useState } from "react"
import { Lock, Plus, Save, Pencil, Trash2, X } from "lucide-react"
import { Toaster, toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/common/ui/alert-dialog"
import { AdminShell } from "@/components/layout/AdminShell"
import {
  ADMIN_FOCUS_VISIBLE_RING_CLASS,
  ADMIN_PRIMARY_ACTION_BUTTON_CLASS,
  ADMIN_SECONDARY_ACTION_BUTTON_CLASS,
} from "@/routes/admin/adminStyleClasses"
import {
  getFestivalSettings,
  isRequestAborted,
  updateFestivalSettings,
} from "@/api/app/festival/festivalSettingsApi"
import { setFestivalDates } from "@/lib/app/festival/festivalCalendar"
import {
  buildFestivalDateRange,
  createEmptyTicketingRound,
  formatDateLabel,
  toForm,
  toPayload,
  EMPTY_FESTIVAL_SETTINGS_FORM,
  type FestivalSettingsForm,
  type TicketingRound,
} from "@/routes/admin/festivalSettings"
import { cn } from "@/components/common/ui/utils"

const inputClass = cn(
  "h-9 w-full rounded-xl border border-[var(--border-base)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]",
  "disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-muted)]",
  ADMIN_FOCUS_VISIBLE_RING_CLASS,
)

export default function AdminSettings() {
  const [settings, setSettings] = useState<FestivalSettingsForm>(EMPTY_FESTIVAL_SETTINGS_FORM)
  const [isEditing, setIsEditing] = useState(false)
  const [draftRound, setDraftRound] = useState<TicketingRound | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  /**
   * 발급된 티켓까지 함께 취소하기로 확인한 회차. 저장할 때 서버에 같이 보낸다.
   * 확인하지 않은 회차를 지우려 하면 서버가 거절한다.
   */
  const [confirmedCancelIds, setConfirmedCancelIds] = useState<number[]>([])
  const [roundPendingConfirm, setRoundPendingConfirm] = useState<TicketingRound | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    getFestivalSettings({ signal: controller.signal })
      .then((dto) => {
        setSettings(toForm(dto))
        // 아직 한 번도 저장하지 않았으면 바로 입력할 수 있게 편집 모드로 연다.
        setIsEditing(dto.operationDates.length === 0)
      })
      .catch((error) => {
        if (isRequestAborted(error)) return
        toast.error("축제 설정을 불러오지 못했습니다.")
        setIsEditing(true)
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [])

  const operationDates = useMemo(
    () => buildFestivalDateRange(settings.startDate, settings.endDate),
    [settings.startDate, settings.endDate],
  )

  const updateSettings = (patch: Partial<FestivalSettingsForm>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  const handleAddRound = () => {
    if (!draftRound) return

    if (!draftRound.ticketingAt || !draftRound.performanceDate || draftRound.capacity <= 0) {
      toast.error("티켓팅 날짜/시간, 티켓 수량, 공연 날짜를 모두 입력해 주세요.")
      return
    }

    setSettings((prev) => ({ ...prev, ticketingRounds: [...prev.ticketingRounds, draftRound] }))
    setDraftRound(null)
  }

  const removeRoundByKey = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      ticketingRounds: prev.ticketingRounds.filter((round) => round.key !== key),
    }))
  }

  const handleRemoveRound = (round: TicketingRound) => {
    // 티켓이 나간 회차를 지우면 학생이 받은 티켓도 함께 사라진다. 한 번 더 확인한다.
    if ((round.issuedTicketCount ?? 0) > 0) {
      setRoundPendingConfirm(round)
      return
    }
    removeRoundByKey(round.key)
  }

  const confirmRemoveIssuedRound = () => {
    if (!roundPendingConfirm) return

    if (roundPendingConfirm.id != null) {
      setConfirmedCancelIds((prev) => [...prev, roundPendingConfirm.id as number])
    }
    removeRoundByKey(roundPendingConfirm.key)
    setRoundPendingConfirm(null)
  }

  const handleSave = async () => {
    if (!settings.festivalName.trim()) {
      toast.error("축제 이름을 입력해 주세요.")
      return
    }
    if (operationDates.length === 0) {
      toast.error("운영 날짜를 시작일부터 종료일까지 올바르게 선택해 주세요.")
      return
    }
    // 운영 날짜가 줄어든 뒤 남아 있는 회차의 공연 날짜를 정리한다. 서버도 같은 검증을 한다.
    const cleaned: FestivalSettingsForm = {
      ...settings,
      ticketingRounds: settings.ticketingRounds.filter((round) =>
        operationDates.includes(round.performanceDate),
      ),
    }

    setIsSaving(true)
    try {
      const saved = await updateFestivalSettings(toPayload(cleaned, confirmedCancelIds))
      setSettings(toForm(saved))
      setConfirmedCancelIds([])
      // 부스맵·타임테이블의 날짜 탭이 저장 즉시 새 운영 날짜를 쓰게 한다.
      setFestivalDates(saved.operationDates)
      setDraftRound(null)
      setIsEditing(false)
      toast.success("축제 설정을 저장했습니다.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "축제 설정을 저장하지 못했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // 편집을 버리고 서버에 저장된 값으로 되돌린다.
    setDraftRound(null)
    setConfirmedCancelIds([])
    getFestivalSettings()
      .then((dto) => {
        setSettings(toForm(dto))
        setIsEditing(false)
      })
      .catch(() => toast.error("저장된 설정을 불러오지 못했습니다."))
  }

  return (
    <>
      <Toaster position="top-right" closeButton richColors />
      <AdminShell
        title="축제 설정"
        eyebrow="FESTIVAL SETTINGS"
        headerClassName="border-b border-[var(--border-base)] bg-[var(--admin-header-bg)]"
        mainClassName="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-6"
        actions={
          isEditing ? (
            <>
              <button type="button" onClick={handleCancel} className={cn(ADMIN_SECONDARY_ACTION_BUTTON_CLASS, "text-sm")}>
                취소
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleSave()}
                className={cn(ADMIN_PRIMARY_ACTION_BUTTON_CLASS, "inline-flex items-center gap-1.5 text-sm")}
              >
                <Save className="h-4 w-4" strokeWidth={2.3} />
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setIsEditing(true)}
              className={cn(ADMIN_PRIMARY_ACTION_BUTTON_CLASS, "inline-flex items-center gap-1.5 text-sm")}
            >
              <Pencil className="h-4 w-4" strokeWidth={2.3} />
              수정
            </button>
          )
        }
      >
        {isLoading && (
          <p className="text-sm text-[var(--text-muted)]">불러오는 중...</p>
        )}

        <section className="rounded-2xl border border-[var(--border-base)] bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[var(--text)]">축제 기본 정보</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            여기서 정한 운영 날짜가 부스맵과 타임테이블의 날짜 탭이 됩니다.
          </p>

          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">축제 이름</span>
              <input
                type="text"
                value={settings.festivalName}
                disabled={!isEditing}
                onChange={(event) => updateSettings({ festivalName: event.target.value })}
                placeholder="예: 2026 DANFESTA"
                className={inputClass}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">운영 시작일</span>
                <input
                  type="date"
                  value={settings.startDate}
                  disabled={!isEditing}
                  onChange={(event) => updateSettings({ startDate: event.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">운영 종료일</span>
                <input
                  type="date"
                  value={settings.endDate}
                  disabled={!isEditing}
                  min={settings.startDate || undefined}
                  onChange={(event) => updateSettings({ endDate: event.target.value })}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="rounded-xl border border-dashed border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 py-2.5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">운영 일자</p>
              {operationDates.length === 0 ? (
                <p className="mt-1 text-sm text-[var(--text-muted)]">시작일과 종료일을 선택해 주세요.</p>
              ) : (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {operationDates.map((date, index) => (
                    <li
                      key={date}
                      className="rounded-full border border-[var(--border-base)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--text)]"
                    >
                      {index + 1}일차 · {formatDateLabel(date)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border-base)] bg-[var(--surface)] p-5 shadow-sm">
          <header className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--text)]">티켓팅</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                회차를 저장하면 티켓팅이 그 시각에 자동으로 열립니다. 회차마다 수량과 공연 날짜를 다르게
                지정할 수 있습니다.
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-full border border-[var(--border-base)] bg-[var(--surface-subtle)] p-0.5">
              {([true, false] as const).map((value) => (
                <button
                  key={String(value)}
                  type="button"
                  disabled={!isEditing}
                  onClick={() => updateSettings({ ticketingEnabled: value })}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold transition-colors disabled:cursor-not-allowed",
                    settings.ticketingEnabled === value
                      ? "bg-[var(--accent)] text-[var(--text-on-accent)]"
                      : "text-[var(--text-muted)]",
                    ADMIN_FOCUS_VISIBLE_RING_CLASS,
                  )}
                >
                  {value ? "ON" : "OFF"}
                </button>
              ))}
            </div>
          </header>

          {settings.ticketingEnabled && (
            <div className="mt-4 space-y-3">
              {settings.ticketingRounds.length === 0 && !draftRound && (
                <p className="rounded-xl border border-dashed border-[var(--border-base)] px-3 py-4 text-center text-sm text-[var(--text-muted)]">
                  등록된 티켓팅 회차가 없습니다.
                  <br />
                  {/* 회차 없이 켜 두면 학생 화면의 티켓팅 목록이 비어 보인다. 막지는 않고 알려만 준다. */}
                  <span className="text-[var(--status-warning-text)]">
                    이대로 저장하면 학생 화면에 응모할 티켓이 보이지 않습니다.
                  </span>
                </p>
              )}

              <ul className="space-y-2">
                {settings.ticketingRounds.map((round, index) => (
                  <li
                    key={round.key}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
                        {index + 1}회차
                        {round.locked && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--status-warning-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--status-warning-text)]">
                            <Lock className="h-3 w-3" strokeWidth={2.4} />
                            티켓팅 시작됨
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-sm text-[var(--text)]">
                        티켓팅 {formatDateTimeLabel(round.ticketingAt)} · {round.capacity.toLocaleString()}개 · 공연{" "}
                        {formatDateLabel(round.performanceDate)}
                      </p>
                      {round.locked && (
                        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                          {(round.issuedTicketCount ?? 0) > 0
                            ? `티켓 ${(round.issuedTicketCount ?? 0).toLocaleString()}장이 발급되어 내용은 수정할 수 없습니다.`
                            : "티켓팅이 시작되어 내용은 수정할 수 없습니다."}
                        </p>
                      )}
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRound(round)}
                        aria-label={`${index + 1}회차 삭제`}
                        className={cn(
                          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-base)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--status-danger)]",
                          ADMIN_FOCUS_VISIBLE_RING_CLASS,
                        )}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2.3} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              {/* 추가를 누르면 이 입력 토글이 열리고, 저장하면 다시 닫힌다. */}
              {isEditing && draftRound && (
                <div className="rounded-xl border border-[var(--border-base)] bg-[var(--surface-subtle)] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-[var(--text)]">새 티켓팅 회차</p>
                    <button
                      type="button"
                      onClick={() => setDraftRound(null)}
                      aria-label="입력 닫기"
                      className={cn("text-[var(--text-muted)]", ADMIN_FOCUS_VISIBLE_RING_CLASS)}
                    >
                      <X className="h-4 w-4" strokeWidth={2.3} />
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">티켓팅 날짜/시간</span>
                      <input
                        type="datetime-local"
                        value={draftRound.ticketingAt}
                        onChange={(event) =>
                          setDraftRound({ ...draftRound, ticketingAt: event.target.value })
                        }
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">티켓 수량</span>
                      <input
                        type="number"
                        min={1}
                        value={draftRound.capacity || ""}
                        onChange={(event) =>
                          setDraftRound({ ...draftRound, capacity: Number(event.target.value) })
                        }
                        placeholder="예: 1000"
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">공연 날짜</span>
                      <select
                        value={draftRound.performanceDate}
                        onChange={(event) =>
                          setDraftRound({ ...draftRound, performanceDate: event.target.value })
                        }
                        className={inputClass}
                      >
                        <option value="">선택</option>
                        {operationDates.map((date, index) => (
                          <option key={date} value={date}>
                            {index + 1}일차 · {formatDateLabel(date)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddRound}
                      className={cn(ADMIN_PRIMARY_ACTION_BUTTON_CLASS, "text-sm")}
                    >
                      회차 저장
                    </button>
                  </div>
                </div>
              )}

              {isEditing && !draftRound && (
                <button
                  type="button"
                  onClick={() => setDraftRound(createEmptyTicketingRound())}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-2xl border border-dashed border-[var(--border-base)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]",
                    ADMIN_FOCUS_VISIBLE_RING_CLASS,
                  )}
                >
                  <Plus className="h-4 w-4" strokeWidth={2.3} />
                  티켓팅 회차 추가
                </button>
              )}
            </div>
          )}
        </section>

      </AdminShell>

      <AlertDialog
        open={Boolean(roundPendingConfirm)}
        onOpenChange={(open) => {
          if (!open) setRoundPendingConfirm(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>발급된 티켓도 함께 취소할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              이 회차로 티켓 {(roundPendingConfirm?.issuedTicketCount ?? 0).toLocaleString()}장이
              이미 발급되었습니다. 회차를 지우면 학생들이 받은 티켓과 대기열이 모두 사라지고,
              되돌릴 수 없습니다. 저장을 눌러야 실제로 반영됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                confirmRemoveIssuedRound()
              }}
            >
              티켓까지 취소하고 삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function formatDateTimeLabel(value: string) {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
