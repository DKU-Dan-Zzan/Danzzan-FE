import { InformationCircleIcon } from "@heroicons/react/24/outline"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  getContentImages,
  getPerformances,
  type ContentImageDto,
} from "../../api/timetableApi"
import DayTabs from "./components/DayTabs"
import Timeline from "./components/Timeline"
import ContentImageSection from "./components/ContentImage"
import type { FestivalDay, Performance } from "./timetable.types"

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
  if (items.length === 0) {
    return { nowId: null as number | null, scrollId: null as number | null }
  }

  const sorted = [...items].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  )

  const nowPerf = sorted.find((p) => {
    const s = timeToMinutes(p.startTime)
    const e = timeToMinutes(p.endTime)
    return s <= nowMinutes && nowMinutes < e
  })
  if (nowPerf) return { nowId: nowPerf.performanceId, scrollId: nowPerf.performanceId }

  const next = sorted.find((p) => timeToMinutes(p.startTime) >= nowMinutes)
  if (next) return { nowId: null, scrollId: next.performanceId }

  return { nowId: null, scrollId: sorted[sorted.length - 1].performanceId }
}

export default function Timetable() {
  const [activeIdx, setActiveIdx] = useState(1)
  const [scrollTargetId, setScrollTargetId] = useState<number | null>(null)
  const [nowTargetId, setNowTargetId] = useState<number | null>(null)

  const [items, setItems] = useState<Performance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [contentImages, setContentImages] = useState<ContentImageDto[]>([])
  const [isImageLoading, setIsImageLoading] = useState(false)
  const [imageLoadError, setImageLoadError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<ContentImageDto | null>(null)

  const didAutoInitRef = useRef(false)
  const didAutoScrollRef = useRef(false)

  useEffect(() => {
    if (didAutoInitRef.current) return
    didAutoInitRef.current = true

    const today = todayISODateLocal()
    const todayIdx = FESTIVAL_DAYS.findIndex((d) => d.date === today)
    if (todayIdx !== -1) setActiveIdx(todayIdx)
  }, [])

  const activeDay = FESTIVAL_DAYS[activeIdx]
  const activeDate = activeDay.date
  const isDay1 = activeDay.key === "DAY-1"

  const title = useMemo(() => "타임테이블", [])
  const subtitle = useMemo(() => "공연 일정을 확인하세요", [])

  useEffect(() => {
    if (isDay1) {
      setItems([])
      setIsLoading(false)
      setLoadError(null)
      return
    }

    let mounted = true

    async function run() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const data = await getPerformances(activeDate)
        if (!mounted) return
        setItems(data.performances ?? [])
      } catch {
        if (!mounted) return
        setItems([])
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
  }, [activeDate, isDay1])

  useEffect(() => {
    if (!isDay1) {
      setSelectedImage(null)
      return
    }

    let mounted = true

    async function run() {
      setIsImageLoading(true)
      setImageLoadError(null)
      try {
        const data = await getContentImages()
        if (!mounted) return
        setContentImages(data ?? [])
      } catch {
        if (!mounted) return
        setContentImages([])
        setImageLoadError("콘텐츠 이미지를 불러오지 못했습니다.")
      } finally {
        if (!mounted) return
        setIsImageLoading(false)
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [isDay1])

  useEffect(() => {
    if (!selectedImage) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null)
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [selectedImage])

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
      setScrollTargetId(null)
      requestAnimationFrame(() => setScrollTargetId(scrollId))
    }
  }, [activeDate, items])

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
    didAutoScrollRef.current = false
  }

  return (
    <div className="h-screen bg-white flex flex-col">
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

      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pt-4 pb-[calc(84px+env(safe-area-inset-bottom))]">
        <div className="min-h-full flex flex-col">
          <div className="mt-4 flex-1">
            {isDay1 ? (
              <ContentImageSection
                images={contentImages}
                isLoading={isImageLoading}
                error={imageLoadError}
                selectedImage={selectedImage}
                onSelectImage={setSelectedImage}
                onCloseImage={() => setSelectedImage(null)}
              />
            ) : isLoading ? (
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

                <div className="mt-5 rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 flex items-start gap-2">
                  <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-700 font-medium">
                    일정은 현장 상황에 따라 변경될 수 있습니다.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
