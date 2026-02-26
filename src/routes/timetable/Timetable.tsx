import { useMemo, useState } from "react"
import DayTabs from "./components/DayTabs"
import DateChip from "./components/DateChip"
import Timeline from "./components/Timeline"
import type { FestivalDate, Performance } from "./timetable.types"

const FESTIVAL_DAYS: FestivalDate[] = [
  { key: "DAY-1", date: "2026-05-12" },
  { key: "DAY-2", date: "2026-05-13" },
  { key: "DAY-3", date: "2026-05-14" },
]

const MOCK_DATA: Performance[] = [
  {
    performanceId: 1,
    startTime: "17:00",
    endTime: "18:30",
    artistId: 10,
    artistName: "경영학과 공연",
    artistImage: null,
    artistDescription: "신나는 무대를 준비했습니다.",
    stage: "메인 무대",
  },
  {
    performanceId: 2,
    startTime: "19:00",
    endTime: "20:00",
    artistId: 11,
    artistName: "초청 가수 A",
    artistImage: null,
    artistDescription: "대표곡 라이브 공연",
    stage: "중앙 무대",
  },
]

export default function Timetable() {
  const [activeIdx, setActiveIdx] = useState(1) // 기본 DAY-2
  const activeDate = FESTIVAL_DAYS[activeIdx].date

  const [items] = useState<Performance[]>(MOCK_DATA)
  const [loading] = useState(false)

  const title = useMemo(() => "타임테이블", [])
  const subtitle = useMemo(() => "공연 일정을 확인하세요", [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <div className="px-5 pt-6 pb-5 bg-blue-600 text-white">
        <div className="text-2xl font-extrabold tracking-tight">{title}</div>
        <div className="mt-1 text-sm text-white/80">{subtitle}</div>

        <DayTabs days={FESTIVAL_DAYS} activeIndex={activeIdx} onChange={setActiveIdx} />
      </div>

      {/* 날짜 칩 */}
      <div className="px-5 -mt-4">
        <DateChip date={activeDate} />
      </div>

      {/* 컨텐츠 */}
      <div className="px-5 pt-4 pb-28">
        {loading ? (
          <div className="py-10 text-center text-gray-400">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-gray-400">등록된 공연이 없습니다.</div>
        ) : (
          <Timeline items={items} />
        )}
      </div>
    </div>
  )
}