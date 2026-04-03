import type { Performance } from "@/types/app/timetable/timetable.types"

function hashtagLabel(description: string) {
  const t = description.trim()
  if (!t) return ""
  return `#${t.replace(/\s+/g, "")}`
}

const AVATAR_PX = "7rem"

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
    <li ref={innerRef} className="relative scroll-mt-24 pb-10">
      <div className="mx-auto flex w-full max-w-[420px] items-stretch pt-3">
        {/* 왼쪽: 시간 — 원형 사진과 같은 높이 밴드 안에서 세로 중앙 */}
        <div className="flex min-w-0 flex-1 shrink-0 justify-end self-start pr-2">
          <div
            className="flex items-center justify-end"
            style={{ height: AVATAR_PX, minHeight: AVATAR_PX }}
          >
            <p
              className="max-w-full text-right text-[19px] font-bold tabular-nums tracking-[-0.02em] text-neutral-800 sm:text-[21px]"
              aria-label={`공연 시간 ${item.startTime}부터 ${item.endTime}까지`}
            >
              {timeLabel}
            </p>
          </div>
        </div>

        {/* 가운데: 노드 + 아래로 길게 이어지는 점선(항목 간 여백까지) */}
        <div className="relative flex w-[32px] shrink-0 flex-col items-center self-stretch">
          <div
            className="flex w-full shrink-0 items-center justify-center"
            style={{ height: AVATAR_PX, minHeight: AVATAR_PX }}
          >
            <div
              className="relative z-[1] h-3.5 w-3.5 rounded-full ring-[3px] ring-[color:color-mix(in_srgb,var(--timetable-v2-accent)_14%,white)]"
              style={{
                background: "var(--timetable-v2-accent)",
                boxShadow: "var(--timetable-v2-timeline-node-shadow)",
              }}
            />
          </div>
          {!isLast ? (
            <div
              className="pointer-events-none absolute left-1/2 w-0 -translate-x-1/2 border-l-2 border-dashed"
              style={{
                top: `calc(${AVATAR_PX} / 2 + 10px)`,
                bottom: "-2.75rem",
                borderLeftColor: "var(--timetable-v2-timeline-dash)",
              }}
              aria-hidden
            />
          ) : null}
        </div>

        {/* 오른쪽: 사진·장르·이름 — 왼쪽·아래로 배치 */}
        <div className="flex min-w-0 flex-1 flex-col items-start pl-2 pr-3 sm:pl-3">
          <div className="flex w-full max-w-[15.5rem] flex-col items-center">
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

            {item.artistDescription ? (
              <p
                className="mt-2.5 max-w-full text-center text-[13px] font-semibold leading-snug"
                style={{ color: "var(--timetable-v2-accent)" }}
              >
                {hashtagLabel(item.artistDescription)}
              </p>
            ) : null}

            <h3
              className={[
                "font-timetable-artist max-w-full text-center text-[1.35rem] leading-snug text-neutral-800",
                item.artistDescription ? "mt-1.5" : "mt-2.5",
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
      </div>
    </li>
  )
}
