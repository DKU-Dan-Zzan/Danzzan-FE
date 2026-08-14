import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react"
import { useSearchParams } from "react-router-dom"
import {
  getContentImages,
  getPerformances,
  getTimetableDisplayConfig,
  type ContentImageDto,
} from "@/api/app/timetable/timetableApi"
import { getPlacementAds } from "@/api/app/ad/adApi"
import AdBanner from "@/components/app/home/AdBanner"
import ContentImageSection from "@/components/app/timetable/ContentImage"
import DayTabs from "@/components/app/timetable/DayTabs"
import Timeline from "@/components/app/timetable/Timeline"
import { cn } from "@/components/common/ui/utils"
import { FESTIVAL_DAYS } from "@/config/festivalDays"
import { appQueryKeys, useAppQuery } from "@/lib/query"
import type { Performance } from "@/types/app/timetable/timetable.types"

/**
 * 콘텐츠 이미지 섹션(1일차 상단 이벤트 배너) 노출 여부.
 *
 * 지난 3일 축제에서는 1일차가 공연 없이 이벤트만 있는 날이라 이 자리에 배너를 띄웠다.
 * 이번 이틀 축제는 1일차부터 공연이 있고 게시할 콘텐츠도 확정되지 않아 임시로 숨긴다.
 * 콘텐츠가 확정되면 true로 되돌리면 된다.
 */
const SHOW_CONTENT_IMAGES: boolean = false

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

  if (nowPerf) {
    return { nowId: nowPerf.performanceId, scrollId: nowPerf.performanceId }
  }

  const next = sorted.find((p) => timeToMinutes(p.startTime) >= nowMinutes)
  if (next) {
    return { nowId: null, scrollId: next.performanceId }
  }

  return { nowId: null, scrollId: sorted[sorted.length - 1].performanceId }
}

export default function Timetable() {
  const SWIPE_MIN_DISTANCE = 48
  const HORIZONTAL_SWIPE_RATIO = 1.2

  const [searchParams] = useSearchParams()
  const [activeIdx, setActiveIdx] = useState(() => {
    const queryDate = searchParams.get("date")
    const baseDate = queryDate || todayISODateLocal()
    const targetIdx = FESTIVAL_DAYS.findIndex((d) => d.date === baseDate)
    // 축제 기간 밖(또는 알 수 없는 date 쿼리)이면 1일차 탭을 연다.
    return targetIdx !== -1 ? targetIdx : 0
  })
  const [scrollTargetId, setScrollTargetId] = useState<number | null>(null)
  const [clockTick, setClockTick] = useState(() => Date.now())
  const [selectedImage, setSelectedImage] = useState<ContentImageDto | null>(null)

  const didAutoScrollRef = useRef(false)
  const swipeStartPointRef = useRef<{ x: number; y: number } | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const contentStartRef = useRef<HTMLDivElement | null>(null)

  const activeDay = FESTIVAL_DAYS[activeIdx]
  const activeDate = activeDay.date
  const isDay1 = activeDay.key === "DAY-1"
  const isTodayTab = activeDate === todayISODateLocal()

  const performancesQuery = useAppQuery({
    queryKey: appQueryKeys.timetablePerformances(activeDate),
    queryFn: ({ signal }) => getPerformances(activeDate, { signal }),
    staleTime: 60_000,
  })

  const contentImagesQuery = useAppQuery({
    queryKey: appQueryKeys.timetableContentImages(),
    enabled: true,
    queryFn: ({ signal }) => getContentImages({ signal }),
    staleTime: 10 * 60_000,
  })

  const displayConfigQuery = useAppQuery({
    queryKey: appQueryKeys.timetableDisplayConfig(),
    enabled: true,
    queryFn: ({ signal }) => getTimetableDisplayConfig({ signal }),
    staleTime: 60_000,
  })

  const allAdsQuery = useAppQuery({
    queryKey: appQueryKeys.placementAds("HOME_BOTTOM"),
    queryFn: ({ signal }) => getPlacementAds("HOME_BOTTOM", { signal }),
    staleTime: 5 * 60_000,
  })

  const items: Performance[] = useMemo(
    () => performancesQuery.data?.performances ?? [],
    [performancesQuery.data],
  )
  const isLoading = performancesQuery.isPending
  const loadError = performancesQuery.error?.message ?? null

  const contentImages = contentImagesQuery.data ?? []
  const isImageLoading = contentImagesQuery.isPending
  const imageLoadError = contentImagesQuery.error?.message ?? null
  const allAds = allAdsQuery.data ?? []
  const comingSoonOverlayEnabled = Boolean(
    displayConfigQuery.data?.comingSoonOverlayEnabled,
  )

  const nowTargetId = useMemo(() => {
    if (!isTodayTab || items.length === 0) {
      return null
    }
    const now = new Date(clockTick)
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const { nowId } = findNowOrNextTarget(items, nowMinutes)
    return nowId
  }, [clockTick, isTodayTab, items])

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
    if (!isTodayTab || items.length === 0) return
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const { scrollId } = findNowOrNextTarget(items, nowMinutes)
    if (!didAutoScrollRef.current) {
      didAutoScrollRef.current = true
      requestAnimationFrame(() => {
        setScrollTargetId(null)
        requestAnimationFrame(() => setScrollTargetId(scrollId))
      })
    }
  }, [isTodayTab, items])

  useEffect(() => {
    if (!isTodayTab || items.length === 0) return
    const id = window.setInterval(() => setClockTick(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [isTodayTab, items])

  const handleChangeDay = (idx: number) => {
    setActiveIdx(idx)
    setScrollTargetId(null)
    setClockTick(Date.now())
    setSelectedImage(null)
    didAutoScrollRef.current = false

    requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    })
  }

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (selectedImage || e.touches.length !== 1) return
    const touch = e.touches[0]
    swipeStartPointRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (selectedImage || e.changedTouches.length === 0) return
    const startPoint = swipeStartPointRef.current
    swipeStartPointRef.current = null
    if (!startPoint) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - startPoint.x
    const deltaY = touch.clientY - startPoint.y
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    const isHorizontalSwipe =
      absDeltaX >= SWIPE_MIN_DISTANCE && absDeltaX > absDeltaY * HORIZONTAL_SWIPE_RATIO

    if (!isHorizontalSwipe) return

    if (deltaX < 0 && activeIdx < FESTIVAL_DAYS.length - 1) {
      handleChangeDay(activeIdx + 1)
    } else if (deltaX > 0 && activeIdx > 0) {
      handleChangeDay(activeIdx - 1)
    }
  }

  const handleTouchCancel = () => {
    swipeStartPointRef.current = null
  }

  return (
    <div className="timetable-root relative flex h-screen min-h-0 flex-col overflow-hidden bg-white">
      <div
        ref={scrollContainerRef}
        className={cn(
          "scrollbar-hide relative min-h-0 flex-1 bg-white [overscroll-behavior:none]",
          comingSoonOverlayEnabled ? "overflow-hidden" : "overflow-y-auto",
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {/* 글로벌 헤더 spacer */}
        <div className="h-[calc(env(safe-area-inset-top)+68px)]" />

        {/* 타이틀 - 스크롤 시 사라짐 */}
        <div className="bg-white pb-1 pl-[28px] pr-4 pt-3">
          <h1 className="mt-1 text-[20px] font-extrabold tracking-tight text-[var(--text-body-deep)]">타임테이블</h1>
        </div>

        {/* DAY 탭만 sticky - 글로벌 헤더 바로 아래 고정 */}
        <div className="sticky top-[calc(env(safe-area-inset-top)+68px)] z-30 bg-white/85 px-4 pb-1 backdrop-blur-md">
          <DayTabs
            days={FESTIVAL_DAYS}
            activeIndex={activeIdx}
            onChange={handleChangeDay}
            compact={false}
          />
        </div>

        <div ref={contentStartRef} className="relative mx-3 mt-1 overflow-hidden rounded-2xl bg-white">
          <div className="px-4 pt-3">
            <p className="text-center text-[11px] font-medium leading-relaxed text-neutral-400">
              * 일정은 현장 상황에 따라 변경될 수 있습니다
            </p>
          </div>

          <div className="px-4 pb-4 pt-5">
            {SHOW_CONTENT_IMAGES && isDay1 && (
              <ContentImageSection
                images={contentImages}
                isLoading={isImageLoading}
                error={imageLoadError}
                selectedImage={selectedImage}
                onSelectImage={setSelectedImage}
                onCloseImage={() => setSelectedImage(null)}
                onRetry={() => {
                  void contentImagesQuery.refetch()
                }}
              />
            )}
            {SHOW_CONTENT_IMAGES && isDay1 && <div className="h-4" />}
            {isLoading ? (
              <div className="py-12 text-center text-[var(--timetable-empty-text)]">
                공연 정보를 불러오는 중입니다...
              </div>
            ) : loadError ? (
              <div className="py-12 text-center text-[var(--timetable-empty-text)]">
                <p>{loadError}</p>
                <button
                  type="button"
                  onClick={() => void performancesQuery.refetch()}
                  className="mt-2 rounded-md border border-[var(--border-subtle)] bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-[var(--text)]"
                >
                  다시 시도
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-[var(--timetable-empty-text)]">
                등록된 공연이 없습니다.
              </div>
            ) : (
              <Timeline
                items={items}
                scrollTargetId={scrollTargetId}
                nowTargetId={isTodayTab ? nowTargetId : null}
              />
            )}
          </div>

          {comingSoonOverlayEnabled && (
            <div className="absolute inset-0 z-20 bg-[rgba(241,243,245,0.86)] backdrop-blur-[4px]" />
          )}
        </div>

        {!comingSoonOverlayEnabled && (
          <AdBanner ads={allAds} marginTopClassName="mt-4" />
        )}
        <div
          aria-hidden="true"
          className="h-[var(--app-bottom-nav-runtime-offset)]"
        />
      </div>

      {comingSoonOverlayEnabled && (
        <div className="fixed bottom-[calc(var(--app-bottom-nav-runtime-offset))] left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2">
          <AdBanner ads={allAds} marginTopClassName="mt-0" />
        </div>
      )}

      {comingSoonOverlayEnabled && (
        <div className="pointer-events-none fixed left-1/2 top-[42%] z-40 flex w-full max-w-[430px] -translate-x-1/2 -translate-y-1/2 justify-center px-6">
          <div className="rounded-full bg-white/28 px-6 py-3 shadow-[0_0_26px_rgba(255,255,255,0.42)] backdrop-blur-[1.5px]">
            <p
              className="text-[clamp(1.5rem,4vw,2.25rem)] font-black tracking-[0.14em]"
              style={{
                color: "var(--timetable-v2-accent)",
                textShadow: "0 1px 10px rgba(255,255,255,0.45)",
              }}
            >
              Coming Soon!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
