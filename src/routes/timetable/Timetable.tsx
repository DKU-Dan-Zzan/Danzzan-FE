import { InformationCircleIcon } from "@heroicons/react/24/outline"
import { Ticket } from "lucide-react"
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type TouchEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  getContentImages,
  getPerformances,
  type ContentImageDto,
} from "@/api/app/timetable/timetableApi"
import ContentImageSection from "@/components/app/timetable/ContentImage"
import DayTabs from "@/components/app/timetable/DayTabs"
import Timeline from "@/components/app/timetable/Timeline"
import { cn } from "@/components/common/ui/utils"
import { APP_HEADER_ROUND_BUTTON_BASE_CLASS } from "@/components/layout/AppHeaderRoundButtonClass"
import { AppHeaderLogo } from "@/components/layout/AppHeaderLogo"
import { getMyTicketNavigationTarget } from "@/lib/common/my-ticket-navigation"
import { appQueryKeys, useAppQuery } from "@/lib/query"
import { authStore } from "@/store/common/authStore"
import type { FestivalDay, Performance } from "@/types/app/timetable/timetable.types"

const FESTIVAL_DAYS: FestivalDay[] = [
  { key: "DAY-1", label: "1일차", date: "2026-05-12" },
  { key: "DAY-2", label: "2일차", date: "2026-05-13" },
  { key: "DAY-3", label: "3일차", date: "2026-05-14" },
]

const EXPANDED_POSTER_SRC = "/posters/timetable-poster-wide.jpeg"
const COMPACT_POSTER_SRC = "/posters/timetable-poster-compact.jpeg"

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
  const POSTER_COLLAPSE_SCROLL_Y = 36
  const navigate = useNavigate()
  const session = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot,
  )

  const [searchParams] = useSearchParams()
  const [activeIdx, setActiveIdx] = useState(() => {
    const queryDate = searchParams.get("date")
    const baseDate = queryDate || todayISODateLocal()
    const targetIdx = FESTIVAL_DAYS.findIndex((d) => d.date === baseDate)
    return targetIdx !== -1 ? targetIdx : 1
  })
  const [scrollTargetId, setScrollTargetId] = useState<number | null>(null)
  const [clockTick, setClockTick] = useState(() => Date.now())
  const [selectedImage, setSelectedImage] = useState<ContentImageDto | null>(null)
  const [isPosterCompact, setIsPosterCompact] = useState(false)

  const didAutoScrollRef = useRef(false)
  const swipeStartPointRef = useRef<{ x: number; y: number } | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const contentStartRef = useRef<HTMLDivElement | null>(null)
  const posterCompactLockRef = useRef(false)
  const previousScrollTopRef = useRef(0)
  const suppressPosterExpandRef = useRef(false)
  const suppressPosterExpandTimerRef = useRef<number | null>(null)

  const activeDay = FESTIVAL_DAYS[activeIdx]
  const activeDate = activeDay.date
  const isDay1 = activeDay.key === "DAY-1"
  const isTodayTab = activeDate === todayISODateLocal()
  const isLoggedIn = !!session.tokens?.accessToken && session.role === "student"

  const performancesQuery = useAppQuery({
    queryKey: appQueryKeys.timetablePerformances(activeDate),
    enabled: !isDay1,
    queryFn: ({ signal }) => getPerformances(activeDate, { signal }),
    staleTime: 60_000,
  })

  const contentImagesQuery = useAppQuery({
    queryKey: appQueryKeys.timetableContentImages(),
    enabled: true,
    queryFn: ({ signal }) => getContentImages({ signal }),
    staleTime: 10 * 60_000,
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
  const posterImage = contentImages[0] ?? null
  const activePosterSrc = isPosterCompact ? COMPACT_POSTER_SRC : EXPANDED_POSTER_SRC

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
    if (!selectedImage) {
      return
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImage(null)
      }
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [selectedImage])

  useEffect(() => {
    if (!isTodayTab || items.length === 0) {
      return
    }

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
    if (!isTodayTab || items.length === 0) {
      return
    }

    const id = window.setInterval(() => {
      setClockTick(Date.now())
    }, 60_000)

    return () => window.clearInterval(id)
  }, [isTodayTab, items])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) {
      return
    }

    const syncPosterState = () => {
      const nextScrollTop = scrollContainer.scrollTop
      const wasScrollingUp = nextScrollTop < previousScrollTopRef.current

      if (nextScrollTop > POSTER_COLLAPSE_SCROLL_Y) {
        posterCompactLockRef.current = true
        setIsPosterCompact(true)
        previousScrollTopRef.current = nextScrollTop
        return
      }

      if (posterCompactLockRef.current) {
        if (!suppressPosterExpandRef.current && wasScrollingUp && nextScrollTop <= 0) {
          posterCompactLockRef.current = false
          setIsPosterCompact(false)
        } else {
          setIsPosterCompact(true)
        }

        previousScrollTopRef.current = nextScrollTop
        return
      }

      setIsPosterCompact(false)
      previousScrollTopRef.current = nextScrollTop
    }

    syncPosterState()
    scrollContainer.addEventListener("scroll", syncPosterState, { passive: true })

    return () => {
      scrollContainer.removeEventListener("scroll", syncPosterState)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (suppressPosterExpandTimerRef.current !== null) {
        window.clearTimeout(suppressPosterExpandTimerRef.current)
      }
    }
  }, [])

  const handleChangeDay = (idx: number) => {
    const shouldKeepCompact = isPosterCompact || posterCompactLockRef.current

    if (suppressPosterExpandTimerRef.current !== null) {
      window.clearTimeout(suppressPosterExpandTimerRef.current)
    }

    suppressPosterExpandRef.current = shouldKeepCompact

    setActiveIdx(idx)
    setScrollTargetId(null)
    setClockTick(Date.now())
    setSelectedImage(null)
    setIsPosterCompact(shouldKeepCompact)
    didAutoScrollRef.current = false

    if (shouldKeepCompact) {
      posterCompactLockRef.current = true
    }

    requestAnimationFrame(() => {
      const scrollContainer = scrollContainerRef.current
      const contentStart = contentStartRef.current
      if (!scrollContainer || !contentStart) {
        return
      }

      const targetTop = Math.max(contentStart.offsetTop - 140, 0)
      scrollContainer.scrollTo({
        top: targetTop,
        behavior: "smooth",
      })
    })

    if (shouldKeepCompact) {
      suppressPosterExpandTimerRef.current = window.setTimeout(() => {
        suppressPosterExpandRef.current = false
        suppressPosterExpandTimerRef.current = null
      }, 500)
    } else {
      suppressPosterExpandRef.current = false
    }
  }

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (selectedImage || e.touches.length !== 1) {
      return
    }

    const touch = e.touches[0]
    swipeStartPointRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    }
  }

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (selectedImage || e.changedTouches.length === 0) {
      return
    }

    const startPoint = swipeStartPointRef.current
    swipeStartPointRef.current = null
    if (!startPoint) {
      return
    }

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - startPoint.x
    const deltaY = touch.clientY - startPoint.y
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    const isHorizontalSwipe =
      absDeltaX >= SWIPE_MIN_DISTANCE &&
      absDeltaX > absDeltaY * HORIZONTAL_SWIPE_RATIO

    if (!isHorizontalSwipe) {
      return
    }

    if (deltaX < 0 && activeIdx < FESTIVAL_DAYS.length - 1) {
      handleChangeDay(activeIdx + 1)
      return
    }

    if (deltaX > 0 && activeIdx > 0) {
      handleChangeDay(activeIdx - 1)
    }
  }

  const handleTouchCancel = () => {
    swipeStartPointRef.current = null
  }

  const handleTicketClick = () => {
    navigate(getMyTicketNavigationTarget(isLoggedIn))
  }

  return (
    <div className="timetable-root relative flex h-screen min-h-0 flex-col overflow-hidden bg-[var(--webapp-main-bg)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(132,166,255,0.2),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.7),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute inset-x-0 top-[180px] h-[320px] bg-[radial-gradient(circle_at_20%_0%,rgba(255,214,195,0.16),transparent_42%),radial-gradient(circle_at_80%_10%,rgba(115,150,255,0.1),transparent_44%)]" />
      <div
        ref={scrollContainerRef}
        className="scrollbar-hide relative min-h-0 flex-1 overflow-y-auto bg-transparent"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <div className="sticky top-0 z-30 bg-white">
          <div className="pt-[env(safe-area-inset-top)]">
            <div
              className={`relative overflow-hidden bg-[var(--surface)] transition-all duration-300 ${
                isPosterCompact ? "h-16" : "h-[244px]"
              }`}
            >
              {!isPosterCompact && (
                <>
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-[linear-gradient(180deg,rgba(19,29,59,0.26),rgba(19,29,59,0))]" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.28)_38%,rgba(255,255,255,0.88))]" />
                </>
              )}
              <button
                type="button"
                disabled={!posterImage}
                onClick={() => {
                  if (posterImage) {
                    setSelectedImage(posterImage)
                  }
                }}
                className="block h-full w-full"
              >
                {posterImage ? (
                  <img
                    key={activePosterSrc}
                    src={activePosterSrc}
                    alt={posterImage.name}
                    className={`h-full w-full object-cover transition-transform duration-500 ${
                      isPosterCompact ? "scale-100" : "scale-[1.015]"
                    }`}
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).src =
                        posterImage.detailImageUrl || posterImage.previewImageUrl
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(228,236,255,0.96),rgba(255,241,234,0.94))] text-sm font-semibold tracking-[0.08em] text-[var(--text-muted)]">
                    POSTER
                  </div>
                )}
              </button>

              {isPosterCompact && (
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))]">
                  <div className="relative mx-auto h-16 max-w-[430px] px-4">
                    <AppHeaderLogo />
                    <button
                      type="button"
                      onClick={handleTicketClick}
                      aria-label={isLoggedIn ? "내 티켓 보기" : "로그인 후 내 티켓 보기"}
                      title={isLoggedIn ? "내 티켓 보기" : "로그인 후 내 티켓 보기"}
                      className={cn(APP_HEADER_ROUND_BUTTON_BASE_CLASS, "pointer-events-auto right-4")}
                    >
                      <Ticket size={20} className="text-[var(--app-header-ticket-btn-icon)]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className={`relative z-20 bg-white px-4 pb-3 ${
              isPosterCompact
                ? "pt-2"
                : "-mt-6 rounded-t-[28px] pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05),0_-18px_36px_-28px_rgba(29,44,89,0.16)]"
            }`}
          >
            {!isPosterCompact && (
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.92),rgba(255,255,255,0))]" />
            )}

            <DayTabs
              days={FESTIVAL_DAYS}
              activeIndex={activeIdx}
              onChange={handleChangeDay}
              compact={isPosterCompact}
            />
          </div>
        </div>

        <div ref={contentStartRef} className="px-4 pt-4">
          <div className="flex items-center gap-3 rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(249,251,255,0.76))] px-4 py-3.5 shadow-[0_18px_48px_-34px_rgba(35,49,94,0.42),0_10px_18px_-18px_rgba(255,255,255,0.86)_inset] backdrop-blur-md ring-1 ring-[rgba(255,255,255,0.72)]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(100,126,220,0.16),rgba(100,126,220,0.08))] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <InformationCircleIcon className="h-4.5 w-4.5 text-[var(--accent)]" />
            </div>
            <p className="text-[14px] font-medium leading-[1.45] tracking-[-0.02em] text-[var(--timetable-info-text)]">
              일정은 현장 상황에 따라 변경될 수 있습니다.
            </p>
          </div>
        </div>

        <div className="px-4 pb-8 pt-6">
          {isDay1 ? (
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
          ) : isLoading ? (
            <div className="py-12 text-center text-[var(--timetable-empty-text)]">
              공연 정보를 불러오는 중입니다...
            </div>
          ) : loadError ? (
            <div className="py-12 text-center text-[var(--timetable-empty-text)]">
              <p>{loadError}</p>
              <button
                type="button"
                onClick={() => {
                  void performancesQuery.refetch()
                }}
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
      </div>
    </div>
  )
}
