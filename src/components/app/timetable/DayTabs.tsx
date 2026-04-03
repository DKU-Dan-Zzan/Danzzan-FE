import type { FestivalDay } from "@/types/app/timetable/timetable.types"

export default function DayTabs({
  days,
  activeIndex,
  onChange,
  compact = false,
}: {
  days: FestivalDay[]
  activeIndex: number
  onChange: (idx: number) => void
  compact?: boolean
}) {
  return (
    <div className="relative border-b border-neutral-100">
      <div className="flex">
        {days.map((d, idx) => {
          const active = idx === activeIndex

          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onChange(idx)}
              className={[
                "relative flex flex-1 flex-col items-center justify-center px-1 transition-opacity duration-200",
                compact ? "min-h-[2.75rem] py-2" : "min-h-[3.1rem] py-3",
                active ? "" : "opacity-55 hover:opacity-90",
              ].join(" ")}
            >
              <span
                className={[
                  "tracking-[0.02em]",
                  compact ? "text-[20px]" : "text-[24px]",
                  active ? "font-black" : "font-extrabold",
                ].join(" ")}
                style={{
                  color: active ? "var(--timetable-v2-accent)" : "var(--timetable-tab-inactive)",
                }}
              >
                {d.key}
              </span>

              {active ? (
                <span
                  className="absolute bottom-0 left-1/2 h-[3px] w-[42%] min-w-[2.75rem] -translate-x-1/2 rounded-t-full bg-[var(--timetable-v2-accent)]"
                  style={{
                    boxShadow: "0 -2px 10px color-mix(in srgb, var(--timetable-v2-accent) 30%, transparent)",
                  }}
                  aria-hidden
                />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
