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
      {/* 좌측 시간 */}
      <div className="w-16 flex flex-col items-center">
        <div className="text-[16px] font-extrabold tabular-nums text-[var(--timetable-active-color)]">
          {item.startTime}
        </div>
      </div>

      {/* 라인: 마지막이어도 세로선 유지 */}
      <div className="relative w-6 flex justify-center">
        {/* NOW 점/라벨 */}
        <div className="relative mt-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--timetable-active-color)]" />

          {showNow && (
            <span className="absolute -top-2 left-4 whitespace-nowrap rounded-full bg-[var(--timetable-active-color)] px-2 py-0.5 text-[11px] font-extrabold text-[var(--text-on-accent)] shadow-sm">
              NOW
            </span>
          )}
        </div>

        {/* 항상 그리기 (마지막은 살짝 연하게 하고 싶으면 opacity만 조절) */}
        <div
          className={`absolute top-4 bottom-0 w-px border-l border-dashed border-[var(--timetable-active-line)] ${
            isLast ? "opacity-40" : "opacity-100"
          }`}
        />
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 pb-6">
        {/* 이미지 */}
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

        {/* 텍스트 영역: 하얀 박스(미니 카드) */}
        <div className={`mt-3 w-full px-4 py-3 ${APP_CARD_VARIANTS.outline} rounded-2xl shadow-none`}>
          <div className="text-[15px] font-extrabold text-[var(--text)]">
            {item.artistName}
          </div>

          <div className="mt-1 text-sm tabular-nums text-[var(--text-muted)]">
            {timeRange}
            {item.stage && <span className="ml-1">· {item.stage}</span>}
          </div>

          {item.artistDescription && (
            <div className="mt-2">
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                {item.artistDescription}
              </p>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
