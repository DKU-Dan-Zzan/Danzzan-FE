import type { Performance } from "../timetable.types"
import TimelineItem from "./TimelineItem"

export default function Timeline({ items }: { items: Performance[] }) {
  return (
    <ul className="space-y-4">
      {items.map((p, idx) => (
        <TimelineItem key={p.performanceId} item={p} isLast={idx === items.length - 1} />
      ))}
    </ul>
  )
}