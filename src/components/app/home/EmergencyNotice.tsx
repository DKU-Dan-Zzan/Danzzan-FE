import { useState } from "react"
import { ChevronDown, Megaphone } from "lucide-react"

export interface EmergencyNoticeData {
  id: number
  title: string
  content: string
  updatedAt?: string
}

interface Props {
  notice: EmergencyNoticeData | null
}

const EmergencyNotice = ({ notice }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const contentId = `emergency-notice-content-${notice?.id ?? "empty"}`
  const updatedAtLabel = (() => {
    if (!notice?.updatedAt) return null

    const parsed = new Date(notice.updatedAt)
    if (Number.isNaN(parsed.getTime())) return null

    return parsed.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  })()

  if (!notice) return null

  return (
    <section className="mt-[var(--home-section-notice-margin-top)] w-full">
      <div className="overflow-hidden rounded-[var(--home-notice-card-radius)] border border-[var(--home-notice-border)] bg-[linear-gradient(145deg,var(--home-notice-bg-start)_0%,var(--home-notice-bg-end)_100%)] shadow-[var(--home-notice-card-shadow)]">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className={`flex w-full gap-2.5 pl-[calc(12px+env(safe-area-inset-left))] pr-[calc(12px+env(safe-area-inset-right))] text-left transition-transform duration-[120ms] active:scale-[0.99] ${
            isExpanded
              ? "h-auto min-h-[var(--home-notice-trigger-height)] items-start py-2"
              : "h-[var(--home-notice-trigger-height)] items-center py-0"
          }`}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          aria-label={isExpanded ? "긴급 공지 접기" : "긴급 공지 전문 펼치기"}
        >
          <div className="flex h-[var(--home-notice-icon-size)] w-[var(--home-notice-icon-size)] shrink-0 items-center justify-center rounded-full border border-[var(--home-notice-icon-border)] bg-[linear-gradient(145deg,var(--home-notice-icon-bg-start)_0%,var(--home-notice-icon-bg-end)_100%)] text-[var(--accent)] shadow-[var(--home-notice-icon-inner-shadow)]">
            <Megaphone size={14} strokeWidth={2.2} />
          </div>

          <div className="min-w-0 flex-1">
            {isExpanded && updatedAtLabel && (
              <p className="mb-1 text-[length:var(--home-notice-updated-font-size)] leading-none text-[var(--text-muted)]">
                업데이트 {updatedAtLabel}
              </p>
            )}
            <p
              id={contentId}
              className={`min-w-0 text-left text-[length:var(--home-notice-body-font-size)] text-[var(--text)] ${
                isExpanded
                  ? "whitespace-pre-wrap break-words leading-6"
                  : "overflow-hidden text-ellipsis whitespace-nowrap leading-none"
              }`}
            >
              {notice.content}
            </p>
          </div>

          <ChevronDown
            size={16}
            className={`shrink-0 text-[var(--text-muted)] transition-transform duration-[180ms] ${isExpanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>
    </section>
  )
}

export default EmergencyNotice
