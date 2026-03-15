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
    <section className="home-emergency-notice-wrapper">
      <div className="home-emergency-notice-card">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className={`home-emergency-notice-trigger ${isExpanded ? "is-expanded" : ""}`}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          aria-label={isExpanded ? "긴급 공지 접기" : "긴급 공지 전문 펼치기"}
        >
          <div className="home-emergency-notice-icon">
            <Megaphone size={14} strokeWidth={2.2} />
          </div>

          <div className="home-emergency-notice-content">
            {isExpanded && updatedAtLabel && (
              <p className="home-emergency-notice-updated-inline">
                업데이트 {updatedAtLabel}
              </p>
            )}
            <p
              id={contentId}
              className={`home-emergency-notice-body ${isExpanded ? "is-expanded" : "is-collapsed"}`}
            >
              {notice.content}
            </p>
          </div>

          <ChevronDown
            size={16}
            className={`home-emergency-notice-chevron ${isExpanded ? "is-expanded" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>
    </section>
  )
}

export default EmergencyNotice
