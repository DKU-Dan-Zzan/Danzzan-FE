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
    <div
      className={[
        "grid grid-cols-3 gap-2 rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(247,248,252,0.88))] p-2 shadow-[0_28px_44px_-34px_rgba(30,41,77,0.42),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl ring-1 ring-[rgba(255,255,255,0.74)]",
        compact ? "rounded-[24px]" : "",
      ].join(" ")}
    >
      {days.map((d, idx) => {
        const active = idx === activeIndex

        return (
          <button
            key={d.key}
            type="button"
            onClick={() => onChange(idx)}
            className={[
              "rounded-[24px] px-3 py-3 text-center transition-all duration-200",
              compact ? "py-2.5" : "py-4",
              active
                ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,247,255,0.92))] text-[var(--text-body-deep)] shadow-[0_16px_30px_-22px_rgba(29,44,89,0.44),inset_0_1px_0_rgba(255,255,255,0.95)]"
                : "text-[var(--timetable-tab-inactive)] hover:bg-[rgba(255,255,255,0.46)]",
            ].join(" ")}
          >
            <div
              className={[
                "text-[20px] font-semibold tracking-[-0.04em]",
                compact ? "text-[17px]" : "",
                active ? "font-extrabold text-[var(--timetable-active-color)]" : "",
              ].join(" ")}
            >
              {d.key}
            </div>
          </button>
        )
      })}
    </div>
  )
}
