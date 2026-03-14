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
  aspect = "314.4/310",
}: Props) {
  const count = posters.length
  const [index, setIndex] = useState(0)

  // posters 개수가 줄어들거나 바뀌었을 때 index 안전 처리
  useEffect(() => {
    if (count === 0) return
    if (index > count - 1) setIndex(0)
  }, [count, index])

  // 자동 슬라이드
  useEffect(() => {
    if (count <= 1) return
    const t = setInterval(() => {
      setIndex((prev) => (prev + 1) % count)
    }, intervalMs)
    return () => clearInterval(t)
  }, [count, intervalMs])

  const translateX = useMemo(() => `-${index * 100}%`, [index])

  // 데이터 없을 때 placeholder UI (디자인 유지)
  if (count === 0) {
    return (
      <section className="mx-auto w-full max-w-[314.4px]">
        <div
          className="
            relative overflow-hidden
            rounded-[26px]
            shadow-[0_18px_40px_rgba(0,0,0,0.10)]
            bg-gradient-to-br from-blue-50 to-violet-50
            border border-gray-100
          "
        >
          <div className="flex items-center justify-center" style={{ aspectRatio: aspect }}>
            <div className="text-center">
              <div className="text-[15px] font-semibold text-gray-800">
                2026 단국축제
              </div>
              <div className="mt-1 text-[12px] text-gray-500">
                축제 포스터 영역
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-[314.4px]">
      {/* 포스터 카드 */}
      <div
        className="
          relative overflow-hidden
          rounded-[28px]
          shadow-[0_24px_70px_rgba(0,0,0,0.14)]
          bg-white
          ring-1 ring-black/5
        "
      >
        {/* 비율 고정 */}
        <div style={{ aspectRatio: aspect }}>
          {/* 슬라이드 트랙 */}
          <div
            className="h-full w-full flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(${translateX})` }}
          >
            {posters.map((p) => (
              <div key={p.id} className="min-w-full h-full relative">
                <img
                  src={p.imageUrl}
                  alt={p.alt ?? "축제 포스터"}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
                {/* 텍스트 올릴 때 가독성용(선택) */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/0 to-black/10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 도트 인디케이터 */}
      {count > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {posters.map((p, i) => {
            const active = i === index
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`포스터 ${i + 1}로 이동`}
                className={`
                  h-1.5 rounded-full transition-all duration-300
                  ${active ? "w-8 bg-blue-600" : "w-2 bg-gray-300"}
                `}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
