import { useEffect, useMemo, useState } from "react"

export type Poster = {
  id: string
  imageUrl: string
  alt?: string
}

type Props = {
  posters: Poster[]
  /** 자동 슬라이드 간격(ms). 기본 3500 */
  intervalMs?: number
  /** 카드 비율. 기본 4/3 */
  aspect?: `${number}/${number}` | string
}

export default function PosterCarousel({
  posters,
  intervalMs = 3500,
  aspect = "4962/7017",
}: Props) {
  const count = posters.length
  const [index, setIndex] = useState(0)

  // 자동 슬라이드
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

  // 데이터 없을 때 placeholder UI (디자인 유지)
  if (count === 0) {
    return (
      <section className="home-content-block">
        <div className="home-poster-placeholder-card">
          <div className="home-poster-placeholder-center" style={{ aspectRatio: aspect }}>
            <div className="home-poster-placeholder-content">
              <div className="home-poster-placeholder-title">
                2026 단국축제
              </div>
              <div className="home-poster-placeholder-subtitle">
                축제 포스터 영역
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="home-content-block">
      {/* 포스터 카드 */}
      <div className="home-poster-card">
        {/* 비율 고정 */}
        <div style={{ aspectRatio: aspect }}>
          {/* 슬라이드 트랙 */}
          <div
            className="home-carousel-track"
            style={{ transform: `translateX(${translateX})` }}
          >
            {posters.map((p) => (
              <div key={p.id} className="home-carousel-slide">
                <img
                  src={p.imageUrl}
                  alt={p.alt ?? "축제 포스터"}
                  className="home-carousel-image"
                  draggable={false}
                />
                {/* 텍스트 올릴 때 가독성용(선택) */}
                <div className="home-poster-overlay" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 도트 인디케이터 */}
      {count > 1 && (
        <div className="home-carousel-dots">
          {posters.map((p, i) => {
            const active = i === safeIndex
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`포스터 ${i + 1}로 이동`}
                className={`home-carousel-dot ${active ? "is-active" : ""}`}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
