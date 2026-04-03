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
      <div className="mx-auto flex w-full max-w-[380px] gap-4 pb-2">
        <div className="flex w-[4.85rem] flex-col items-center">
          <div className="min-w-[4.85rem] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,248,255,0.82))] px-3.5 py-1.5 text-center text-[15px] font-extrabold tabular-nums tracking-[-0.02em] text-[var(--timetable-active-color)] shadow-[0_18px_34px_-24px_rgba(27,38,73,0.44),inset_0_1px_0_rgba(255,255,255,0.96)] ring-1 ring-[rgba(255,255,255,0.78)]">
            {item.startTime}
          </div>
        </div>

        <div className="relative flex w-6 justify-center">
          <div className="relative mt-3">
            <div className="h-3 w-3 rounded-full bg-[var(--timetable-active-color)] shadow-[0_0_0_7px_rgba(86,112,205,0.1),0_8px_18px_-10px_rgba(57,94,188,0.55)]" />

            {showNow && (
              <span className="absolute -top-2 left-5 whitespace-nowrap rounded-full bg-[linear-gradient(135deg,rgba(60,95,203,0.98),rgba(95,127,230,0.94))] px-2.5 py-1 text-[10px] font-extrabold tracking-[0.08em] text-[var(--text-on-accent)] shadow-[0_14px_28px_-16px_rgba(29,44,89,0.65)]">
                NOW
              </span>
            )}
          </div>

          <div
            className={`absolute top-5 bottom-0 w-px bg-[linear-gradient(180deg,rgba(102,125,210,0.75),rgba(154,173,235,0.18))] ${
              isLast ? "opacity-40" : "opacity-100"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative overflow-hidden rounded-[34px] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(247,249,255,0.82))] px-4 py-4 shadow-[0_30px_60px_-40px_rgba(23,34,68,0.55),0_18px_28px_-24px_rgba(23,34,68,0.18),inset_0_1px_0_rgba(255,255,255,0.96)] ring-1 ring-[rgba(255,255,255,0.76)]">
            <div className="pointer-events-none absolute inset-x-4 top-0 h-14 bg-[linear-gradient(180deg,rgba(112,141,233,0.08),rgba(112,141,233,0))]" />
            <div className="flex items-start gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[28px] shadow-[0_18px_32px_-24px_rgba(29,44,89,0.4)] ring-1 ring-[rgba(255,255,255,0.9)]">
                <img
                  src={item.artistImageUrl ?? "/placeholder-artist.png"}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).src = "/placeholder-artist.png"
                  }}
                />
              </div>

              <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-wrap items-start gap-x-2 gap-y-2">
                  <div className="text-[20px] font-black leading-[1.1] tracking-[-0.04em] text-[var(--text)]">
                    {item.artistName}
                  </div>

                  {item.artistDescription && (
                    <p className="rounded-full bg-[rgba(96,118,190,0.08)] px-2.5 py-1 text-[11px] font-semibold leading-none tracking-[0.02em] text-[color:color-mix(in_srgb,var(--text-muted)_86%,white)]">
                      {item.artistDescription}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-[13px] text-[var(--text-muted)]">
                  <span className="rounded-full bg-[rgba(255,255,255,0.72)] px-2.5 py-1 font-semibold tabular-nums tracking-[-0.01em] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                    {timeRange}
                  </span>
                  {item.stage && (
                    <span className="rounded-full bg-[rgba(96,118,190,0.08)] px-2.5 py-1 font-medium tracking-[-0.01em] text-[var(--text-body-deep)]">
                      {item.stage}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
