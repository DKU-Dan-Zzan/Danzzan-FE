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
    <li ref={innerRef} className="relative scroll-mt-24">
      <div className="mx-auto flex w-full max-w-[360px] gap-4 pb-6">
        <div className="flex w-16 flex-col items-center">
          <div className="min-w-[4.75rem] rounded-full bg-[color:color-mix(in_srgb,white_84%,var(--webapp-main-bg))] px-3 py-1 text-center text-[16px] font-extrabold tabular-nums tracking-[-0.02em] text-[var(--timetable-active-color)] shadow-[0_12px_22px_-18px_rgba(29,44,89,0.38)] ring-1 ring-[color:color-mix(in_srgb,var(--border-base)_54%,white)]">
            {item.startTime}
          </div>
        </div>

        <div className="relative flex w-6 justify-center">
          <div className="relative mt-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--timetable-active-color)] shadow-[0_0_0_5px_rgba(57,94,188,0.1)]" />

            {showNow && (
              <span className="absolute -top-2 left-4 whitespace-nowrap rounded-full bg-[color:color-mix(in_srgb,var(--timetable-active-color)_88%,white)] px-2.5 py-1 text-[10px] font-extrabold tracking-[0.08em] text-[var(--text-on-accent)] shadow-[0_10px_18px_-14px_rgba(29,44,89,0.55)]">
                NOW
              </span>
            )}
          </div>

          <div
            className={`absolute top-4 bottom-0 w-px border-l border-dashed border-[color:color-mix(in_srgb,var(--timetable-active-line)_72%,white)] ${
              isLast ? "opacity-40" : "opacity-100"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={`h-36 w-36 overflow-hidden ${APP_CARD_VARIANTS.outline} rounded-full shadow-[0_18px_30px_-22px_rgba(29,44,89,0.34)] ring-1 ring-[rgba(255,255,255,0.92)]`}
          >
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
              <div className="text-[18px] font-extrabold tracking-[-0.03em] text-[var(--text)]">
                {item.artistName}
              </div>

              {item.artistDescription && (
                <p className="relative -top-0.5 text-[12px] font-medium leading-none tracking-[-0.01em] text-[color:color-mix(in_srgb,var(--text-muted)_86%,white)]">
                  {item.artistDescription}
                </p>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] tabular-nums text-[var(--text-muted)]">
              <span className="tracking-[-0.01em]">{timeRange}</span>
              {item.stage && (
                <>
                  <span
                    className="h-1 w-1 rounded-full bg-[color:color-mix(in_srgb,var(--timetable-active-line)_84%,white)]"
                    aria-hidden="true"
                  />
                  <span className="tracking-[-0.01em]">{item.stage}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
