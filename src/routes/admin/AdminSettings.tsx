// 역할: 관리자 콘솔의 기본 페이지. 축제 이름/운영 날짜/티켓팅 회차 등 축제 운영 정보를 등록한다.
//
// 지금은 입력한 값을 브라우저(localStorage)에만 저장한다.
// 백엔드 작업이 끝나면 loadFestivalSettings/saveFestivalSettings 두 함수만 API 호출로 바꾸면 된다.
// 여기서 저장한 운영 날짜가 앞으로 부스맵·타임테이블의 날짜 탭이 된다.
// (지금은 src/config/festivalDays.ts 와 src/utils/app/boothmap/festivalDates.ts 에 날짜가 박혀 있다.)
import { useMemo, useState } from "react"
import { Plus, Save, Pencil, Trash2, X } from "lucide-react"
import { Toaster, toast } from "sonner"

import { AdminShell } from "@/components/layout/AdminShell"
import {
  ADMIN_FOCUS_VISIBLE_RING_CLASS,
  ADMIN_PRIMARY_ACTION_BUTTON_CLASS,
  ADMIN_SECONDARY_ACTION_BUTTON_CLASS,
} from "@/routes/admin/adminStyleClasses"
import {
  buildFestivalDateRange,
  createEmptyTicketingRound,
  formatDateLabel,
  loadFestivalSettings,
  saveFestivalSettings,
  type FestivalSettings,
  type TicketingRound,
} from "@/routes/admin/festivalSettings"
import { cn } from "@/components/common/ui/utils"

const inputClass = cn(
  "h-9 w-full rounded-xl border border-[var(--border-base)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]",
  "disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-muted)]",
  ADMIN_FOCUS_VISIBLE_RING_CLASS,
)

export default function AdminSettings() {
  const [settings, setSettings] = useState<FestivalSettings>(() => loadFestivalSettings())
  // 저장된 값이 있으면 읽기 모드로, 처음 들어왔으면 바로 입력할 수 있게 편집 모드로 연다.
  const [isEditing, setIsEditing] = useState(() => !loadFestivalSettings().savedAt)
  const [draftRound, setDraftRound] = useState<TicketingRound | null>(null)

  const operationDates = useMemo(
    () => buildFestivalDateRange(settings.startDate, settings.endDate),
    [settings.startDate, settings.endDate],
  )

  const updateSettings = (patch: Partial<FestivalSettings>) => {
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

  const handleRemoveRound = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      ticketingRounds: prev.ticketingRounds.filter((round) => round.id !== id),
    }))
  }

  const handleSave = () => {
    if (!settings.festivalName.trim()) {
      toast.error("축제 이름을 입력해 주세요.")
      return
    }
    if (operationDates.length === 0) {
      toast.error("운영 날짜를 시작일부터 종료일까지 올바르게 선택해 주세요.")
      return
    }
    if (settings.ticketingEnabled && settings.ticketingRounds.length === 0) {
      toast.error("티켓팅을 사용하려면 티켓팅 회차를 한 개 이상 추가해 주세요.")
      return
    }

    // 운영 날짜가 줄어든 뒤 남아 있는 회차의 공연 날짜를 정리한다.
    const rounds = settings.ticketingRounds.map((round) =>
      operationDates.includes(round.performanceDate) ? round : { ...round, performanceDate: "" },
    )
    const saved = { ...settings, ticketingRounds: rounds, savedAt: new Date().toISOString() }
    setSettings(saved)
    saveFestivalSettings(saved)
    setDraftRound(null)
    setIsEditing(false)
    toast.success("축제 설정을 저장했습니다.")
  }

  const handleCancel = () => {
    setSettings(loadFestivalSettings())
    setDraftRound(null)
    setIsEditing(false)
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
                onClick={handleSave}
                className={cn(ADMIN_PRIMARY_ACTION_BUTTON_CLASS, "inline-flex items-center gap-1.5 text-sm")}
              >
                <Save className="h-4 w-4" strokeWidth={2.3} />
                저장
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={cn(ADMIN_PRIMARY_ACTION_BUTTON_CLASS, "inline-flex items-center gap-1.5 text-sm")}
            >
              <Pencil className="h-4 w-4" strokeWidth={2.3} />
              수정
            </button>
          )
        }
      >
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
                티켓팅 회차마다 수량과 공연 날짜를 다르게 지정할 수 있습니다.
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
                </p>
              )}

              <ul className="space-y-2">
                {settings.ticketingRounds.map((round, index) => (
                  <li
                    key={round.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-base)] bg-[var(--surface-subtle)] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-muted)]">{index + 1}회차</p>
                      <p className="mt-0.5 text-sm text-[var(--text)]">
                        티켓팅 {formatDateTimeLabel(round.ticketingAt)} · {round.capacity.toLocaleString()}개 · 공연{" "}
                        {formatDateLabel(round.performanceDate)}
                      </p>
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRound(round.id)}
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

        {settings.savedAt && !isEditing && (
          <p className="text-right text-xs text-[var(--text-muted)]">
            마지막 저장: {formatDateTimeLabel(settings.savedAt)}
          </p>
        )}
      </AdminShell>
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
