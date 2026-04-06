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
  /** 홈 히어로 영역을 꽉 채우는 풀 블리드 모드 */
  fillViewport?: boolean
}

export default function PosterCarousel({
  posters,
  intervalMs = 3500,
  aspect = "4962/7017",
  fillViewport = false,
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
    const sectionClassName = fillViewport ? "w-full" : "mx-auto w-full max-w-[430px]"
    const wrapperClassName = fillViewport
      ? "relative -mt-[env(safe-area-inset-top)] h-[calc(100svh+var(--home-hero-nav-overlap)+env(safe-area-inset-top))] min-h-[560px] overflow-hidden bg-[var(--home-poster-placeholder-bg)]"
      : "relative ml-[var(--spacing-8)] mr-[calc(-1*var(--spacing-4))] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--home-poster-placeholder-bg)] shadow-[var(--home-poster-placeholder-shadow)]"

    return (
      <section className={sectionClassName}>
        <div className={wrapperClassName}>
          <div
            className={fillViewport ? "flex h-full items-center justify-center" : "flex items-center justify-center"}
            style={fillViewport ? undefined : { aspectRatio: aspect }}
          >
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

  const sectionClassName = fillViewport ? "w-full" : "mx-auto w-full max-w-[430px]"
  const wrapperClassName = fillViewport
    ? "relative -mt-[env(safe-area-inset-top)] h-[calc(100svh+var(--home-hero-nav-overlap)+env(safe-area-inset-top))] min-h-[560px] overflow-hidden bg-[var(--surface_container_lowest)]"
    : "relative ml-[var(--spacing-8)] mr-[calc(-1*var(--spacing-4))] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--surface_container_lowest)] shadow-[var(--home-poster-card-shadow)]"

  return (
    <section className={sectionClassName}>
      {/* 포스터 카드 */}
      <div className={wrapperClassName}>
        {/* 비율 고정 */}
        <div className={fillViewport ? "h-full" : undefined} style={fillViewport ? undefined : { aspectRatio: aspect }}>
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
      {!fillViewport && count > 1 && (
        <div className="mt-[var(--home-dot-margin-top)] flex justify-center gap-[var(--home-dot-gap)]">
          {posters.map((p, i) => {
            const active = i === safeIndex
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`포스터 ${i + 1}로 이동`}
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
