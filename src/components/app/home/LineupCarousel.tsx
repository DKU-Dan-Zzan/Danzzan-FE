// 역할: home 화면에서 사용하는 Lineup Carousel UI 블록을 렌더링합니다.
import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from "react"

export type LineupBanner = {
  id: string
  imageUrl: string
  alt?: string
}

type Props = {
  banners: LineupBanner[]
  intervalMs?: number
  aspect?: `${number}/${number}` | string
}

const LINEUP_CARD_WIDTH_PX = 314.4
const LINEUP_CARD_HEIGHT_PX = 138
const LINEUP_CARD_HALF_WIDTH_PX = LINEUP_CARD_WIDTH_PX / 2
const LINEUP_CARD_GAP_PX = 12

export default function LineupCarousel({
  banners,
  intervalMs = 4500,
  aspect = `${LINEUP_CARD_WIDTH_PX}/${LINEUP_CARD_HEIGHT_PX}`,
}: Props) {
  const count = banners.length
  const [index, setIndex] = useState(0)
  const [trackIndex, setTrackIndex] = useState(count > 1 ? 1 : 0)
  const [isTrackTransitionEnabled, setIsTrackTransitionEnabled] = useState(true)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)

  useEffect(() => {
    setIndex(0)
    setTrackIndex(count > 1 ? 1 : 0)
    setIsTrackTransitionEnabled(true)
  }, [count])

  const trackBanners = useMemo(() => {
    if (count <= 1) return banners

    const first = banners[0]
    const last = banners[count - 1]
    return [last, ...banners, first]
  }, [banners, count])

  const goNext = useCallback(() => {
    if (count <= 1) return

    setIsTrackTransitionEnabled(true)
    setTrackIndex((prev) => prev + 1)
    setIndex((prev) => (prev + 1) % count)
  }, [count])

  const goPrev = useCallback(() => {
    if (count <= 1) return

    setIsTrackTransitionEnabled(true)
    setTrackIndex((prev) => prev - 1)
    setIndex((prev) => (prev - 1 + count) % count)
  }, [count])

  useEffect(() => {
    if (count <= 1) return
    const t = setInterval(() => {
      goNext()
    }, intervalMs)
    return () => clearInterval(t)
  }, [count, goNext, intervalMs])

  useEffect(() => {
    if (isTrackTransitionEnabled) return

    let rafId1 = 0
    let rafId2 = 0
    rafId1 = requestAnimationFrame(() => {
      rafId2 = requestAnimationFrame(() => {
        setIsTrackTransitionEnabled(true)
      })
    })

    return () => {
      cancelAnimationFrame(rafId1)
      cancelAnimationFrame(rafId2)
    }
  }, [isTrackTransitionEnabled])

  const safeIndex = useMemo(() => {
    if (count === 0) return 0
    return ((index % count) + count) % count
  }, [count, index])
  const translateX = useMemo(
    () =>
      `calc(50% - ${LINEUP_CARD_HALF_WIDTH_PX}px - ${trackIndex} * (${LINEUP_CARD_WIDTH_PX}px + ${LINEUP_CARD_GAP_PX}px))`,
    [trackIndex],
  )

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]
    touchStartXRef.current = touch.clientX
    touchStartYRef.current = touch.clientY
  }

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (count <= 1) return
    if (touchStartXRef.current === null || touchStartYRef.current === null) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartXRef.current
    const deltaY = touch.clientY - touchStartYRef.current

    touchStartXRef.current = null
    touchStartYRef.current = null

    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY)
    const SWIPE_THRESHOLD = 35

    if (!isHorizontalSwipe || Math.abs(deltaX) < SWIPE_THRESHOLD) return

    if (deltaX < 0) {
      goNext()
      return
    }

    goPrev()
  }

  const handleTrackTransitionEnd = () => {
    if (count <= 1) return

    if (trackIndex === 0) {
      setIsTrackTransitionEnabled(false)
      setTrackIndex(count)
      setIndex(count - 1)
      return
    }

    if (trackIndex === count + 1) {
      setIsTrackTransitionEnabled(false)
      setTrackIndex(1)
      setIndex(0)
    }
  }

  if (count === 0) return null

  return (
    <section className="mx-auto w-full max-w-[430px]">
      <div
        className="touch-pan-y overflow-hidden px-[14px]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={isTrackTransitionEnabled ? "flex gap-3 transition-transform duration-500 ease-out" : "flex gap-3 transition-none"}
          style={{ transform: `translateX(${translateX})` }}
          onTransitionEnd={handleTrackTransitionEnd}
        >
          {trackBanners.map((banner, position) => {
            const isCenterCard = position === trackIndex
            const isLeftSideCard = position < trackIndex
            const sideCardOriginClass = isLeftSideCard ? "origin-right" : "origin-left"

            return (
              <div
                key={`${banner.id}-${position}`}
                className={`relative shrink-0 overflow-hidden rounded-[1.85rem] bg-[var(--surface_container_lowest)] transition-[transform,opacity] duration-500 ease-out will-change-transform ${
                  isCenterCard
                    ? "scale-100 opacity-100 shadow-[var(--home-lineup-card-shadow)]"
                    : `${sideCardOriginClass} scale-[0.67] opacity-82 shadow-[0_14px_24px_-20px_rgba(44,52,54,0.14)]`
                }`}
                style={{ width: `${LINEUP_CARD_WIDTH_PX}px` }}
              >
                <div style={{ aspectRatio: aspect }}>
                  <img
                    src={banner.imageUrl}
                    alt={banner.alt ?? "라인업 이미지"}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(118%_94%_at_50%_42%,rgba(255,255,255,0)_64%,rgba(13,24,36,0.22)_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24),inset_0_24px_42px_-34px_rgba(255,255,255,0.36),inset_0_-30px_48px_-32px_rgba(11,19,30,0.34)]"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {count > 1 && (
        <div className="mt-[var(--home-dot-margin-top)] flex justify-center gap-[var(--home-dot-gap)]">
          {banners.map((banner, i) => {
            const active = i === safeIndex
            return (
              <button
                key={banner.id}
                type="button"
                onClick={() => {
                  if (count <= 1) return
                  setIsTrackTransitionEnabled(true)
                  setIndex(i)
                  setTrackIndex(i + 1)
                }}
                aria-label={`라인업 ${i + 1}로 이동`}
                className={`h-[var(--home-dot-height)] rounded-full bg-[var(--surface_container_high)] transition-all duration-300 ${
                  active ? "w-[var(--home-dot-active-width)] bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary_container)_100%)]" : "w-[var(--home-dot-width)]"
                }`}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
