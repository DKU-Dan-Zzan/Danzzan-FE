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
        "grid grid-cols-3 gap-1.5 rounded-[26px] border border-[color:color-mix(in_srgb,var(--border-base)_68%,white)] bg-[color:color-mix(in_srgb,white_58%,var(--webapp-main-bg))] p-1.5 shadow-[0_18px_34px_-30px_rgba(29,44,89,0.36)] backdrop-blur-md",
        compact ? "rounded-[22px]" : "",
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
              "rounded-[20px] px-3 py-3 text-center transition-all duration-200",
              compact ? "py-2.5" : "py-3.5",
              active
                ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,253,0.92))] text-[var(--text-body-deep)] shadow-[0_14px_24px_-20px_rgba(29,44,89,0.5)]"
                : "text-[var(--timetable-tab-inactive)]",
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
