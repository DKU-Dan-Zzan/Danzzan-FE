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
    if (count === 0) return
    if (index > count - 1) setIndex(0)
  }, [count, index])

  useEffect(() => {
    if (count <= 1) return
    const t = setInterval(() => {
      setIndex((prev) => (prev + 1) % count)
    }, intervalMs)
    return () => clearInterval(t)
  }, [count, intervalMs])

  const translateX = useMemo(() => `-${index * 100}%`, [index])

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
    <section className="mx-auto w-full max-w-[314.4px]">
      <div
        className="
          relative overflow-hidden
          rounded-[16px]
          bg-white
          ring-1 ring-black/5
          shadow-[0_14px_35px_rgba(0,0,0,0.12)]
          touch-pan-y
        "
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{ aspectRatio: aspect }}>
          <div
            className="h-full w-full flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(${translateX})` }}
          >
            {banners.map((banner) => (
              <div key={banner.id} className="min-w-full h-full">
                <img
                  src={banner.imageUrl}
                  alt={banner.alt ?? "라인업 이미지"}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {count > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {banners.map((banner, i) => {
            const active = i === index
            return (
              <button
                key={banner.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`라인업 ${i + 1}로 이동`}
                className={`h-1.5 rounded-full transition-all duration-300 ${active ? "w-8 bg-slate-400" : "w-2 bg-slate-300"}`}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
