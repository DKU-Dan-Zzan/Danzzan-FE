import { useEffect, useMemo, useState } from "react"

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
  aspect = "16/4",
}: Props) {
  const count = banners.length
  const [index, setIndex] = useState(0)

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

  if (count === 0) return null

  return (
    <section className="max-w-[430px] mx-auto px-4">
      <div
        className="
          relative overflow-hidden
          rounded-[22px]
          bg-white
          ring-1 ring-black/5
          shadow-[0_14px_35px_rgba(0,0,0,0.12)]
        "
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
    </section>
  )
}
