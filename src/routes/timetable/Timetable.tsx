import { useMemo, useState } from "react"
import DayTabs from "./components/DayTabs"
import DateChip from "./components/DateChip"
import Timeline from "./components/Timeline"
import type { FestivalDay, Performance } from "./timetable.types"

import { InformationCircleIcon } from "@heroicons/react/24/outline"

const FESTIVAL_DAYS: FestivalDay[] = [
  { key: "DAY-1", label: "1일차", date: "2026-05-12" },
  { key: "DAY-2", label: "2일차", date: "2026-05-13" },
  { key: "DAY-3", label: "3일차", date: "2026-05-14" },
]

// UI용 Mock (나중에 API 붙이면 이 부분만 교체)
const MOCK_BY_DATE: Record<string, Performance[]> = {
  "2026-05-12": [
    {
      performanceId: 101,
      startTime: "17:00",
      endTime: "18:30",
      artistId: 1,
      artistName: "컴퓨터공학과 공연",
      artistImage: null,
      artistDescription: "신나는 무대를 준비했습니다.",
      stage: "메인 무대",
    },
  ],
  "2026-05-13": [
    {
      performanceId: 201,
      startTime: "17:00",
      endTime: "18:30",
      artistId: 10,
      artistName: "경영학과 공연",
      artistImage: null,
      artistDescription: "신나는 무대를 준비했습니다.",
      stage: "메인 무대",
    },
    {
      performanceId: 202,
      startTime: "19:00",
      endTime: "20:00",
      artistId: 11,
      artistName: "초청 가수 A",
      artistImage: null,
      artistDescription: "대표곡 라이브 공연",
      stage: "중앙 무대",
    },
  ],
  "2026-05-14": [
    {
      performanceId: 301,
      startTime: "18:10",
      endTime: "19:00",
      artistId: 20,
      artistName: "게스트 가수 B",
      artistImage: null,
      artistDescription: "히트곡 메들리",
      stage: "메인 무대",
    },
  ],
}

export default function Timetable() {
  const [activeIdx, setActiveIdx] = useState(1) // default DAY-2
  const activeDate = FESTIVAL_DAYS[activeIdx].date

  const title = useMemo(() => "타임테이블", [])
  const subtitle = useMemo(() => "공연 일정을 확인하세요", [])

  const items = MOCK_BY_DATE[activeDate] ?? []

  return (
    <div className="min-h-screen bg-white">
      {/* 상단 영역(화이트, 붙어있는 레이아웃) */}
      <div className="bg-white">
        <div className="px-5 pt-5 pb-4">
          <div className="text-[38px] font-extrabold text-blue-600 font-cute">{title}</div>
          <div className="mt-1 text-sm text-gray-500">{subtitle}</div>

          <div className="mt-4">
            <DayTabs days={FESTIVAL_DAYS} activeIndex={activeIdx} onChange={setActiveIdx} />
          </div>

          <div className="mt-3">
            <DateChip date={activeDate} />
          </div>
        </div>
      </div>

      {/* 리스트 */}
      <div className="px-5 pt-4 pb-28">
        {items.length === 0 ? (
          <div className="py-12 text-center text-gray-400">등록된 공연이 없습니다.</div>
        ) : (
          <>
            <Timeline items={items} />

            <div className="mt-10 rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 flex items-start gap-2">
            <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
            <p className="text-sm text-blue-700 font-medium">
              일정은 현장 상황에 따라 변경될 수 있습니다.
            </p>
          </div>
          </>
        )}
      </div>
    </div>
  )
}