import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react"

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

export default function LineupCarousel({
  banners,
  intervalMs = 4500,
  aspect = "314.4/138",
}: Props) {
  const count = banners.length
  const [index, setIndex] = useState(0)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)

  useEffect(() => {
    if (count <= 1) return
    const t = setInterval(() => {
      setIndex((prev) => (prev + 1) % count)
    }, intervalMs)
    return () => clearInterval(t)
  }, [count, intervalMs])

  const safeIndex = useMemo(() => {
    if (count === 0) return 0
    return index % count
  }, [count, index])
  const translateX = useMemo(() => `-${safeIndex * 100}%`, [safeIndex])

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
      setIndex((prev) => (prev + 1) % count)
      return
    }

    setIndex((prev) => (prev - 1 + count) % count)
  }

  if (count === 0) return null

  return (
    <section className="home-content-block">
      <div className="home-lineup-card" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div style={{ aspectRatio: aspect }}>
          <div
            className="home-carousel-track"
            style={{ transform: `translateX(${translateX})` }}
          >
            {banners.map((banner) => (
              <div key={banner.id} className="home-carousel-slide">
                <img
                  src={banner.imageUrl}
                  alt={banner.alt ?? "라인업 이미지"}
                  className="home-carousel-image"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {count > 1 && (
        <div className="home-carousel-dots">
          {banners.map((banner, i) => {
            const active = i === safeIndex
            return (
              <button
                key={banner.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`라인업 ${i + 1}로 이동`}
                className={`home-carousel-dot ${active ? "is-active" : ""}`}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
