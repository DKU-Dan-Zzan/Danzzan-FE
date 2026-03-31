// 역할: timetable 화면에서 사용하는 Timeline Item UI 블록을 렌더링합니다.
import { APP_CARD_VARIANTS } from "@/components/common/ui/appCardVariants"
import type { Performance } from "@/types/app/timetable/timetable.types"

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
  const timeRange = `${item.startTime} ~ ${item.endTime}`

  return (
    <li ref={innerRef} className="relative flex gap-4 scroll-mt-24">
      <div className="flex w-16 flex-col items-center">
        <div className="text-[16px] font-extrabold tabular-nums text-[var(--timetable-active-color)]">
          {item.startTime}
        </div>
      </div>

      <div className="relative flex w-6 justify-center">
        <div className="relative mt-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--timetable-active-color)]" />

          {showNow && (
            <span className="absolute -top-2 left-4 whitespace-nowrap rounded-full bg-[var(--timetable-active-color)] px-2 py-0.5 text-[11px] font-extrabold text-[var(--text-on-accent)] shadow-sm">
              NOW
            </span>
          )}
        </div>

        <div
          className={`absolute top-4 bottom-0 w-px border-l border-dashed border-[var(--timetable-active-line)] ${
            isLast ? "opacity-40" : "opacity-100"
          }`}
        />
      </div>

      <div className="flex-1 pb-6">
        <div className={`h-36 w-36 overflow-hidden ${APP_CARD_VARIANTS.outline} rounded-full shadow-none`}>
          <img
            src={item.artistImageUrl ?? "/placeholder-artist.png"}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).src = "/placeholder-artist.png"
            }}
          />
        </div>

        <div className="mt-3 w-full px-1 py-1">
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <div className="text-[17px] font-extrabold tracking-[-0.01em] text-[var(--text)]">
              {item.artistName}
            </div>

            {item.artistDescription && (
              <p className="relative -top-1 text-[13px] leading-none text-[var(--text-muted)]">
                {item.artistDescription}
              </p>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm tabular-nums text-[var(--text-muted)]">
            <span>{timeRange}</span>
            {item.stage && (
              <>
                <span className="h-1 w-1 rounded-full bg-[var(--timetable-active-line)]" aria-hidden="true" />
                <span>{item.stage}</span>
              </>
            )}
          </div>

        </div>
      </div>
    </li>
  )
}
