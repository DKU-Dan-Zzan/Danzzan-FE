import type { Performance } from "@/types/app/timetable/timetable.types"

function hashtagLabel(description: string) {
  const t = description.trim()
  if (!t) return ""
  return `#${t.replace(/\s+/g, "")}`
}

/** 원형 사진 */
const AVATAR_PX = "10rem"

export default function TimelineItem({
  item,
  isLast,
  innerRef,
  showNow,
}: {
  item: Performance
  isLast: boolean
  innerRef?: (el: HTMLLIElement | null) => void
  showNow?: boolean
}) {
  const timeLabel = `${item.startTime} ~ ${item.endTime}`

  return (
    <li ref={innerRef} className="relative scroll-mt-24 pb-14">
      <div className="mx-auto grid w-full max-w-[420px] grid-cols-[auto_24px_minmax(0,1fr)] items-start pt-3">
        {/* 시간 */}
        <div className="col-start-1 row-start-1 flex items-start justify-end self-start pr-1">
          <p
            className="max-w-[9.5rem] text-right text-[14px] font-bold tabular-nums leading-tight tracking-[-0.02em] text-neutral-800 sm:max-w-[10rem] sm:text-[15px]"
            aria-label={`공연 시간 ${item.startTime}부터 ${item.endTime}까지`}
          >
            {timeLabel}
          </p>
        </div>

        {/* 타임라인: 점 + 긴 점선 */}
        <div className="col-start-2 row-span-2 row-start-1 flex w-[24px] shrink-0 flex-col items-center self-stretch">
          <div className="flex w-full shrink-0 justify-center">
            <div
              className="relative z-[1] h-3.5 w-3.5 shrink-0 rounded-full ring-[3px] ring-[color:color-mix(in_srgb,var(--timetable-v2-accent)_14%,white)]"
              style={{
                background: "var(--timetable-v2-accent)",
                boxShadow: "var(--timetable-v2-timeline-node-shadow)",
              }}
            />
          </div>
          {!isLast ? (
            <div
              className="mx-auto mt-0 min-h-[12rem] w-0 flex-1 border-l-2 border-dashed"
              style={{
                borderLeftColor: "var(--timetable-v2-timeline-dash)",
                marginBottom: "-3rem",
              }}
              aria-hidden
            />
          ) : null}
        </div>

        {/* 원형 사진 + 장르·가수명·스테이지 — 한 열에 붙여서 바로 아래 */}
        <div className="col-start-3 row-span-2 flex flex-col items-center self-start pl-2 pr-3 sm:pl-2">
          <div className="relative shrink-0">
            <img
              src={item.artistImageUrl ?? "/placeholder-artist.png"}
              alt=""
              className="rounded-full object-cover shadow-[0_4px_14px_rgba(15,23,42,0.08)]"
              style={{ width: AVATAR_PX, height: AVATAR_PX, minWidth: AVATAR_PX, minHeight: AVATAR_PX }}
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).src = "/placeholder-artist.png"
              }}
            />

            {showNow ? (
              <span
                className="absolute -right-1 -top-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-on-accent)] shadow-md"
                style={{
                  background: "var(--timetable-v2-now-bg)",
                  boxShadow: "var(--timetable-v2-now-shadow)",
                }}
              >
                NOW
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex w-full max-w-[19rem] flex-col items-center">
            {item.artistDescription ? (
              <p
                className="max-w-full text-center text-[13px] font-semibold leading-snug"
                style={{ color: "var(--timetable-v2-accent)" }}
              >
                {hashtagLabel(item.artistDescription)}
              </p>
            ) : null}

            <h3
              className={[
                "font-timetable-artist max-w-full text-center text-[1.35rem] leading-snug text-neutral-800",
                item.artistDescription ? "mt-1" : "mt-0",
              ].join(" ")}
            >
              <span className="text-neutral-300">&#8216;</span>
              {item.artistName}
              <span className="text-neutral-300">&#8217;</span>
            </h3>

            {item.stage ? (
              <span className="mt-2.5 inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-500">
                {item.stage}
              </span>
            ) : null}
          </div>
        </div>

        <div className="col-start-1 row-start-2 min-h-0" aria-hidden />
      </div>
    </li>
  )
}
