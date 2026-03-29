// 역할: home 화면에서 사용하는 Poster Carousel UI 블록을 렌더링합니다.
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
      <section className="mx-auto w-full max-w-[var(--home-content-max-width)]">
        <div className="relative overflow-hidden rounded-none bg-[var(--home-poster-placeholder-bg)] shadow-[var(--home-poster-placeholder-shadow)]">
          <div className="flex items-center justify-center" style={{ aspectRatio: aspect }}>
            <div className="text-center">
              <div className="text-[15px] leading-[1.3] font-semibold text-[var(--text)]">
                2026 단국축제
              </div>
              <div className="mt-1 text-xs leading-[1.3] text-[var(--text-muted)]">
                축제 포스터 영역
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-[var(--home-content-max-width)]">
      {/* 포스터 카드 */}
      <div className="relative overflow-hidden rounded-none bg-[var(--home-card-bg)] shadow-[var(--home-poster-card-shadow)]">
        {/* 비율 고정 */}
        <div style={{ aspectRatio: aspect }}>
          {/* 슬라이드 트랙 */}
          <div
            className="flex h-full w-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(${translateX})` }}
          >
            {posters.map((p) => (
              <div key={p.id} className="relative h-full min-w-full">
                <img
                  src={p.imageUrl}
                  alt={p.alt ?? "축제 포스터"}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
                {/* 텍스트 올릴 때 가독성용(선택) */}
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgb(0_0_0_/_0.2),rgb(0_0_0_/_0),rgb(0_0_0_/_0.1))]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 도트 인디케이터 */}
      {count > 1 && (
        <div className="mt-[var(--home-dot-margin-top)] flex justify-center gap-[var(--home-dot-gap)]">
          {posters.map((p, i) => {
            const active = i === safeIndex
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`포스터 ${i + 1}로 이동`}
                className={`h-[var(--home-dot-height)] rounded-full bg-[var(--home-card-border)] transition-all duration-300 ${
                  active ? "w-[var(--home-dot-active-width)] bg-[var(--accent)]" : "w-[var(--home-dot-width)]"
                }`}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
