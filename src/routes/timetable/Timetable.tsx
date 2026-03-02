import { useEffect, useMemo, useRef, useState } from "react"
import DayTabs from "./components/DayTabs"
import DateChip from "./components/DateChip"
import Timeline from "./components/Timeline"
import type { FestivalDay, Performance } from "./timetable.types"

import { InformationCircleIcon } from "@heroicons/react/24/outline"
import Footer from "../../components/layout/Footer"
import { getPerformances } from "../../api/timetableApi" 

const FESTIVAL_DAYS: FestivalDay[] = [
  { key: "DAY-1", label: "1일차", date: "2026-05-12" },
  { key: "DAY-2", label: "2일차", date: "2026-05-13" },
  { key: "DAY-3", label: "3일차", date: "2026-05-14" },
]

function todayISODateLocal() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function timeToMinutes(t: string) {
  const [hh, mm] = t.split(":").map((x) => Number(x))
  return hh * 60 + mm
}

function findNowOrNextTarget(items: Performance[], nowMinutes: number) {
  if (items.length === 0) return { nowId: null as number | null, scrollId: null as number | null }

  const sorted = [...items].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  )

  // 1) 진행 중 공연: start <= now < end
  const nowPerf = sorted.find((p) => {
    const s = timeToMinutes(p.startTime)
    const e = timeToMinutes(p.endTime)
    return s <= nowMinutes && nowMinutes < e
  })
  if (nowPerf) return { nowId: nowPerf.performanceId, scrollId: nowPerf.performanceId }

  // 2) 다음 공연: start >= now
  const next = sorted.find((p) => timeToMinutes(p.startTime) >= nowMinutes)
  if (next) return { nowId: null, scrollId: next.performanceId }

  // 3) 마지막 공연
  return { nowId: null, scrollId: sorted[sorted.length - 1].performanceId }
}

export default function Timetable() {
  const [activeIdx, setActiveIdx] = useState(1)
  const [scrollTargetId, setScrollTargetId] = useState<number | null>(null)
  const [nowTargetId, setNowTargetId] = useState<number | null>(null)

  // API 연동용 상태 추가 
  const [items, setItems] = useState<Performance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const didAutoInitRef = useRef(false)
  const didAutoScrollRef = useRef(false)

  useEffect(() => {
    if (didAutoInitRef.current) return
    didAutoInitRef.current = true

    const today = todayISODateLocal()
    const todayIdx = FESTIVAL_DAYS.findIndex((d) => d.date === today)
    if (todayIdx !== -1) setActiveIdx(todayIdx)
  }, [])

  const activeDate = FESTIVAL_DAYS[activeIdx].date

  const title = useMemo(() => "타임테이블", [])
  const subtitle = useMemo(() => "공연 일정을 확인하세요", [])

  // activeDate 바뀔 때마다 API 호출해서 items 채움
  useEffect(() => {
    let mounted = true

    async function run() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const data = await getPerformances(activeDate)
        if (!mounted) return
        setItems(data.performances ?? [])
      } catch (e: any) {
        if (!mounted) return
        setItems([])
        // 에러 메시지는 너무 길게 안 보이게 최소화
        setLoadError("공연 정보를 불러오지 못했습니다.")
      } finally {
        if (!mounted) return
        setIsLoading(false)
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [activeDate])

  // 오늘 탭이면 now/scroll 타겟 계산 + 최초 1회 자동 스크롤
  useEffect(() => {
    const today = todayISODateLocal()
    const isTodayTab = activeDate === today
    if (!isTodayTab) {
      setNowTargetId(null)
      return
    }
    if (items.length === 0) return

    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()

    const { nowId, scrollId } = findNowOrNextTarget(items, nowMinutes)
    setNowTargetId(nowId)

    if (!didAutoScrollRef.current) {
      didAutoScrollRef.current = true
      // 트리거 확실히
      setScrollTargetId(null)
      requestAnimationFrame(() => setScrollTargetId(scrollId))
    }
  }, [activeDate, items])

  // 1분마다 현재 공연 업데이트
  useEffect(() => {
    const today = todayISODateLocal()
    const isTodayTab = activeDate === today
    if (!isTodayTab || items.length === 0) return

    const id = window.setInterval(() => {
      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const { nowId } = findNowOrNextTarget(items, nowMinutes)
      setNowTargetId(nowId)
    }, 60_000)

    return () => window.clearInterval(id)
  }, [activeDate, items])

  const handleChangeDay = (idx: number) => {
    setActiveIdx(idx)
    setScrollTargetId(null)

    // 날짜 바뀌면 해당 날짜에서 다시 “최초 1회” 자동스크롤 동작 가능하게 초기화
    didAutoScrollRef.current = false
  }

  return (
    // 페이지 전체는 고정 높이 + column
    <div className="h-screen bg-white flex flex-col">
      {/* 상단 고정 영역 */}
      <div className="sticky top-0 z-20 bg-white">
        <div className="px-5 pt-5">
          <div className="text-[38px] font-extrabold text-blue-600 font-cute">
            {title}
          </div>
          <div className="mt-1 text-sm text-gray-500">{subtitle}</div>

          <div className="mt-4">
            <DayTabs
              days={FESTIVAL_DAYS}
              activeIndex={activeIdx}
              onChange={handleChangeDay}
            />
          </div>
        </div>
      </div>

      {/* 여기부터만 스크롤 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pt-4 pb-[calc(84px+env(safe-area-inset-bottom))]">
        <div className="min-h-full flex flex-col">
          {/* 날짜칩 */}
          <DateChip date={activeDate} />

          <div className="mt-4 flex-1">
            {isLoading ? (
              <div className="py-12 text-center text-gray-400">
                공연 정보를 불러오는 중입니다...
              </div>
            ) : loadError ? (
              <div className="py-12 text-center text-gray-400">
                공연 정보를 불러오지 못했습니다.
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                등록된 공연이 없습니다.
              </div>
            ) : (
              <>
                <Timeline
                  items={items}
                  scrollTargetId={scrollTargetId}
                  nowTargetId={nowTargetId}
                />

                <div className="mt-10 rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 flex items-start gap-2">
                  <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-700 font-medium">
                    일정은 현장 상황에 따라 변경될 수 있습니다.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer는 맨 아래로 */}
          <div className="mt-16 -mx-5">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  )
}