// 역할: timetable 화면에서 사용하는 Timeline UI 블록을 렌더링합니다.
import { useLayoutEffect, useRef } from "react"
import type { Performance } from "@/types/app/timetable/timetable.types"
import TimelineItem from "./TimelineItem"

export default function Timeline({
  items,
  scrollTargetId,
  nowTargetId,
}: {
  items: Performance[]
  scrollTargetId?: number | null
  nowTargetId?: number | null
}) {
  const itemRefs = useRef<Record<number, HTMLLIElement | null>>({})

  useLayoutEffect(() => {
    if (!scrollTargetId) return

    let cancelled = false
    let tries = 0

    const tryScroll = () => {
      if (cancelled) return
      const el = itemRefs.current[scrollTargetId]

      if (el) {
        // DOM 확정된 상태에서 스크롤
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        return
      }

      // ref가 아직 없으면 몇 번 더 재시도
      tries += 1
      if (tries < 6) requestAnimationFrame(tryScroll)
    }

    requestAnimationFrame(tryScroll)

    return () => {
      cancelled = true
    }
  }, [scrollTargetId, items])

  return (
    <ul className="space-y-6">
      {items.map((p, idx) => (
        <TimelineItem
          key={p.performanceId}
          item={p}
          isLast={idx === items.length - 1}
          showNow={nowTargetId === p.performanceId}
          innerRef={(el) => {
            itemRefs.current[p.performanceId] = el
          }}
        />
      ))}
    </ul>
  )
}
