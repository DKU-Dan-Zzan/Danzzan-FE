import type { FestivalDate } from "../timetable.types"

export default function DayTabs({
  days,
  activeIndex,
  onChange,
}: {
  days: FestivalDate[]
  activeIndex: number
  onChange: (idx: number) => void
}) {
  return (
    <div className="mt-4 bg-white/15 rounded-2xl p-1 flex">
      {days.map((d, idx) => {
        const active = idx === activeIndex
        return (
          <button
            key={d.key}
            onClick={() => onChange(idx)}
            className={[
              "flex-1 h-11 rounded-xl text-sm font-semibold transition",
              active ? "bg-white text-blue-700 shadow" : "text-white/80 hover:text-white",
            ].join(" ")}
          >
            {d.key}
          </button>
        )
      })}
    </div>
  )
}