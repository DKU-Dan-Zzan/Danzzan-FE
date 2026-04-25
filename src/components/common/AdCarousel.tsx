// 역할: 광고 이미지 슬라이딩 캐러셀을 렌더링합니다.
// 5초마다 랜덤 순서로 자동 전환되며, hover(PC)/touch(모바일) 시 일시정지됩니다.
import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/components/common/ui/utils"

export interface AdSlide {
  imageUrl: string
  alt?: string
  linkUrl?: string | null
  updatedAt?: string
}

interface AdCarouselProps {
  slides: AdSlide[]
  intervalMs?: number
  containerClassName?: string
  imageClassName?: string
}

const buildVersionedUrl = (imageUrl: string, updatedAt?: string): string => {
  if (!updatedAt) return imageUrl
  const version = encodeURIComponent(updatedAt)
  return imageUrl.includes("?") ? `${imageUrl}&v=${version}` : `${imageUrl}?v=${version}`
}

const shuffleArray = <T,>(arr: T[]): T[] => {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const HOVER_POINTER_MEDIA_QUERY = "(hover: hover) and (pointer: fine)"

export function AdCarousel({
  slides,
  intervalMs = 5000,
  containerClassName = "",
  imageClassName = "block h-full w-full object-cover",
}: AdCarouselProps) {
  const [shuffled, setShuffled] = useState<AdSlide[]>(() =>
    slides.length ? shuffleArray(slides) : [],
  )
  // displayIndex: 1-based index into extended array [clone_last, ...real, clone_first]
  const [displayIndex, setDisplayIndex] = useState(1)
  const [animated, setAnimated] = useState(false)
  const [isHoverPaused, setIsHoverPaused] = useState(false)
  const [supportsHoverPause, setSupportsHoverPause] = useState(false)
  const displayIndexRef = useRef(1)

  // Reshuffle whenever slide URLs change
  const slidesKey = slides.map((s) => s.imageUrl).join("|")
  useEffect(() => {
    if (!slides.length) {
      setShuffled([])
      return
    }
    const next = shuffleArray(slides)
    setShuffled(next)
    setDisplayIndex(1)
    displayIndexRef.current = 1
    setAnimated(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slidesKey])

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
    const mediaQuery = window.matchMedia(HOVER_POINTER_MEDIA_QUERY)
    const syncHoverSupport = () => {
      setSupportsHoverPause(mediaQuery.matches)
      if (!mediaQuery.matches) {
        setIsHoverPaused(false)
      }
    }

    syncHoverSupport()
    mediaQuery.addEventListener("change", syncHoverSupport)

    return () => {
      mediaQuery.removeEventListener("change", syncHoverSupport)
    }
  }, [])

  const n = shuffled.length
  const isPaused = supportsHoverPause && isHoverPaused

  // Extended slides for seamless infinite loop: [last, ...real, first]
  const extended = n > 1 ? [shuffled[n - 1], ...shuffled, shuffled[0]] : shuffled

  const advance = useCallback(() => {
    if (n <= 1) return
    setAnimated(true)
    setDisplayIndex((prev) => {
      const next = prev + 1
      displayIndexRef.current = next
      return next
    })
  }, [n])

  // Auto-advance timer
  useEffect(() => {
    if (n <= 1 || isPaused) return
    const id = setInterval(advance, intervalMs)
    return () => clearInterval(id)
  }, [n, isPaused, advance, intervalMs])

  // Infinite loop snap: after transition to clone, instantly jump to real slide
  const handleTransitionEnd = () => {
    if (n <= 1) return
    const current = displayIndexRef.current
    if (current > n) {
      setAnimated(false)
      setDisplayIndex(1)
      displayIndexRef.current = 1
    } else if (current < 1) {
      setAnimated(false)
      setDisplayIndex(n)
      displayIndexRef.current = n
    }
  }

  if (!slides.length) return null

  // Single slide: render without carousel overhead
  if (n === 1) {
    const slide = shuffled[0]
    const url = buildVersionedUrl(slide.imageUrl, slide.updatedAt)
    const img = (
      <img
        src={url}
        alt={slide.alt ?? "광고 배너"}
        className={imageClassName}
        loading="eager"
      />
    )
    return (
      <div className={cn("relative w-full overflow-hidden", containerClassName)}>
        {slide.linkUrl ? (
          <a href={slide.linkUrl} target="_blank" rel="noreferrer" className="block h-full w-full">
            {img}
          </a>
        ) : (
          img
        )}
      </div>
    )
  }

  const translateX = -(displayIndex * 100)

  return (
    <div
      className={cn("relative w-full overflow-hidden", containerClassName)}
      onMouseEnter={() => {
        if (supportsHoverPause) {
          setIsHoverPaused(true)
        }
      }}
      onMouseLeave={() => {
        if (supportsHoverPause) {
          setIsHoverPaused(false)
        }
      }}
      aria-label="광고 배너 슬라이드"
    >
      <div
        className="flex h-full w-full"
        style={{
          transform: `translateX(${translateX}%)`,
          transition: animated
            ? "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
            : "none",
          willChange: "transform",
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extended.map((slide, idx) => {
          const url = buildVersionedUrl(slide.imageUrl, slide.updatedAt)
          const isCurrent = idx === displayIndex
          const img = (
            <img
              src={url}
              alt={slide.alt ?? "광고 배너"}
              className={imageClassName}
              loading={isCurrent ? "eager" : "lazy"}
            />
          )
          return (
            <div
              key={`${slide.imageUrl}-${idx}`}
              className="basis-full shrink-0 grow-0 max-w-full overflow-hidden"
              aria-hidden={!isCurrent}
            >
              {slide.linkUrl ? (
                <a href={slide.linkUrl} target="_blank" rel="noreferrer" className="block h-full w-full">
                  {img}
                </a>
              ) : (
                img
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
