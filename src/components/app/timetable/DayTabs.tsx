import type { FestivalDay } from "@/types/app/timetable/timetable.types"

export default function DayTabs({
  days,
  activeIndex,
  onChange,
}: {
  days: FestivalDay[]
  activeIndex: number
  onChange: (idx: number) => void
}) {
  return (
    <div className="relative mt-3">
      {/* 탭들 */}
      <div className="grid grid-cols-3 items-center pb-3">
        {days.map((d, idx) => {
          const active = idx === activeIndex
          return (
            <button
              key={d.key}
              onClick={() => onChange(idx)}
              className={[
                "relative justify-self-center",
                "px-3 py-2",
                "text-xl tracking-wide transition-colors",
                active
                  ? "text-[var(--accent)] font-extrabold"
                  : "text-[var(--timetable-tab-inactive)] hover:text-[var(--text-muted)]",
              ].join(" ")}
            >

              {/* 커진 느낌 scale로 */}
              <span
                className={
                  active
                    ? "inline-block scale-[1.06] transition-transform"
                    : "inline-block transition-transform"
                }
              >
                {d.key}
              </span>
            </button>
          )
        })}
      </div>

      {/* 베이스 라인 */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-[var(--timetable-card-border)]" />

      {/* 밑줄 */}
      <div
        className="absolute bottom-0 h-[4px] rounded-full bg-[var(--accent)] transition-[left] duration-200"
        style={{
          left: `${(100 / days.length) * activeIndex}%`,
          width: `${100 / days.length}%`,
        }}
      />
    </div>
  )
}
