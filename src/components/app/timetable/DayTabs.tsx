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
    <div className={compact ? "relative" : "relative mt-1"}>
      <div className={`grid grid-cols-3 items-center ${compact ? "pb-2" : "pb-3"}`}>
        {days.map((d, idx) => {
          const active = idx === activeIndex

          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onChange(idx)}
              className={[
                "relative justify-self-center transition-colors",
                compact ? "px-2 py-1.5 text-lg tracking-[0.02em]" : "px-3 py-2 text-xl tracking-wide",
                active
                  ? "font-extrabold text-[var(--text-body-deep)]"
                  : "text-[var(--timetable-tab-inactive)] hover:text-[var(--text-muted)]",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block transition-transform",
                  active ? (compact ? "scale-[1.03]" : "scale-[1.06]") : "",
                ].join(" ")}
              >
                {d.key}
              </span>
            </button>
          )
        })}
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-[var(--timetable-card-border)]" />

      <div
        className={`absolute bottom-0 rounded-full bg-[var(--text-body-deep)] transition-[left] duration-200 ${
          compact ? "h-[3px]" : "h-[4px]"
        }`}
        style={{
          left: `${(100 / days.length) * activeIndex}%`,
          width: `${100 / days.length}%`,
        }}
      />
    </div>
  )
}
