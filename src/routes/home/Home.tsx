// 역할: 홈 라우트에서 포스터·라인업·긴급공지·하단광고 서버 상태를 조합해 렌더링합니다.
import { useCallback, useEffect, useMemo, useRef } from "react"

import PosterCarousel, { type Poster } from "@/components/app/home/PosterCarousel"
import EmergencyNotice, { type EmergencyNoticeData } from "@/components/app/home/EmergencyNotice"
import LineupSection, { type LineupBanner } from "@/components/app/home/LineupSection"
import CurrentPerformanceSection from "@/components/app/home/CurrentPerformanceSection";
import AdBanner from "@/components/app/home/AdBanner";
import DelayedSpinner from "@/components/common/loading/DelayedSpinner";

import { getEmergencyNotice, getHomeImages, getLineupImages } from "@/api/app/home/homeApi"
import { getPlacementAds } from "@/api/app/ad/adApi"
import {
  shouldReleaseHomeAnchorLock,
  shouldTriggerHomeAnchor,
} from "@/lib/home/anchorScroll";
import { appQueryKeys, useAppQuery } from "@/lib/query"

const dummyPosters: Poster[] = [
  { id: "p1", imageUrl: "/posters/dummy.jpg", alt: "2026 단국축제 포스터" },
]

const getVersionFromImageUrl = (imageUrl: string) => {
  const match = imageUrl.match(/[?&]v=([^&#]+)/)
  if (!match?.[1]) return null

  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

const withImageVersion = (imageUrl: string, version?: string | null) => {
  if (!version?.trim()) return imageUrl

  const [urlWithoutHash, hash = ""] = imageUrl.split("#")
  if (/[?&]v=/.test(urlWithoutHash)) return imageUrl

  const separator = urlWithoutHash.includes("?") ? "&" : "?"
  const nextUrl = `${urlWithoutHash}${separator}v=${encodeURIComponent(version.trim())}`
  return hash ? `${nextUrl}#${hash}` : nextUrl
}

function Home() {
  const lineupAnchorRef = useRef<HTMLDivElement | null>(null);
  const anchorLockRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);

  const imagesQuery = useAppQuery({
    queryKey: appQueryKeys.homeImages(),
    queryFn: ({ signal }) => getHomeImages({ signal }),
    staleTime: 5 * 60_000,
  })

  const lineupQuery = useAppQuery({
    queryKey: appQueryKeys.homeLineup(),
    queryFn: ({ signal }) => getLineupImages({ signal }),
    staleTime: 5 * 60_000,
  })

  const emergencyNoticeQuery = useAppQuery({
    queryKey: appQueryKeys.homeEmergencyNotice(),
    queryFn: ({ signal }) => getEmergencyNotice({ signal }),
    staleTime: 0,
    refetchOnMount: "always",
  })

  const allAdsQuery = useAppQuery({
    queryKey: appQueryKeys.placementAds("HOME_BOTTOM"),
    queryFn: ({ signal }) => getPlacementAds("HOME_BOTTOM", { signal }),
    staleTime: 5 * 60_000,
  })

  const posters = useMemo<Poster[]>(() => {
    const images = imagesQuery.data
    if (!images?.length) {
      return dummyPosters
    }

    return images.map((img, idx) => ({
      id: `${img.id}-${img.version?.trim() || getVersionFromImageUrl(img.imageUrl) || "noversion"}`,
      imageUrl: withImageVersion(img.imageUrl, img.version),
      alt: `포스터 ${idx + 1}`,
    }))
  }, [imagesQuery.data])

  const lineups = useMemo<LineupBanner[]>(() => {
    const images = lineupQuery.data
    if (!images?.length) {
      return []
    }

    return images.map((img, idx) => ({
      id: String(img.id),
      imageUrl: img.imageUrl,
      alt: `라인업 이미지 ${idx + 1}`,
    }))
  }, [lineupQuery.data])

  const hasLineupAnchor = lineups.length > 0;

  const scrollToLineupAnchor = useCallback(() => {
    if (!hasLineupAnchor) return;
    if (!lineupAnchorRef.current) return;

    anchorLockRef.current = true;
    lineupAnchorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hasLineupAnchor]);

  const notice = useMemo<EmergencyNoticeData | null>(() => {
    if (!emergencyNoticeQuery.data) {
      return null
    }

    return {
      id: emergencyNoticeQuery.data.id,
      title: "긴급공지 및 내용",
      content: emergencyNoticeQuery.data.content,
      updatedAt: emergencyNoticeQuery.data.updatedAt ?? undefined,
    }
  }, [emergencyNoticeQuery.data])

  const corePending =
    imagesQuery.isPending ||
    emergencyNoticeQuery.isPending
  const accessoryPending =
    lineupQuery.isPending ||
    allAdsQuery.isPending
  const shouldShowInlineSpinner =
    (corePending || accessoryPending) &&
    !imagesQuery.data?.length &&
    !emergencyNoticeQuery.data
  const allAds = allAdsQuery.data ?? []

  const error =
    imagesQuery.error?.message ??
    lineupQuery.error?.message ??
    emergencyNoticeQuery.error?.message ??
    null

  const handleRetryAll = () => {
    void imagesQuery.refetch()
    void lineupQuery.refetch()
    void emergencyNoticeQuery.refetch()
    void allAdsQuery.refetch()
  }

  useEffect(() => {
    if (!hasLineupAnchor) return;

    const getScrollTop = () => window.scrollY || document.documentElement.scrollTop || 0;
    const releaseLockIfTopReached = () => {
      const scrollTop = getScrollTop();
      if (shouldReleaseHomeAnchorLock(scrollTop)) {
        anchorLockRef.current = false;
      }
      return scrollTop;
    };

    const handleWheel = (event: WheelEvent) => {
      const scrollTop = releaseLockIfTopReached();
      if (!shouldTriggerHomeAnchor({
        deltaY: event.deltaY,
        scrollTop,
        isLocked: anchorLockRef.current,
      })) {
        return;
      }

      event.preventDefault();
      scrollToLineupAnchor();
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const startY = touchStartYRef.current;
      const currentY = event.touches[0]?.clientY;
      if (startY == null || currentY == null) return;

      const deltaY = startY - currentY;
      const scrollTop = releaseLockIfTopReached();
      if (!shouldTriggerHomeAnchor({
        deltaY,
        scrollTop,
        isLocked: anchorLockRef.current,
      })) {
        return;
      }

      event.preventDefault();
      touchStartYRef.current = currentY;
      scrollToLineupAnchor();
    };

    const handleTouchEnd = () => {
      touchStartYRef.current = null;
    };

    const handleScroll = () => {
      releaseLockIfTopReached();
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [hasLineupAnchor, scrollToLineupAnchor]);

  return (
    <div className="home-root flow-root min-h-full bg-[var(--bg-page-soft)] [background-image:var(--home-page-gradient)] bg-no-repeat bg-[length:100%_100%] [animation:ec-fade-in_360ms_ease-out_both]">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40">
        <div className="mx-auto w-full max-w-[430px] px-3 pt-[calc(env(safe-area-inset-top)+68px)]">
          <div className="pointer-events-auto">
            <EmergencyNotice notice={notice} />
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-auto mt-3 w-full max-w-[var(--home-content-max-width)] rounded-[var(--radius-lg)] border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-xs leading-[1.35] text-[var(--status-danger-text)]">
          <div>{error}</div>
          <button
            type="button"
            onClick={handleRetryAll}
            className="mt-2 rounded-[var(--radius-md)] bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary_container)_100%)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-on-accent)] shadow-[var(--ec-ambient-shadow)]"
          >
            다시 시도
          </button>
        </div>
      )}

      <div className="[&>*:nth-child(1)]:[animation:ec-fade-up_380ms_ease-out_both] [&>*:nth-child(2)]:[animation:ec-fade-up_440ms_ease-out_both] [&>*:nth-child(3)]:[animation:ec-fade-up_500ms_ease-out_both] [&>*:nth-child(4)]:[animation:ec-fade-up_560ms_ease-out_both]">
        <div className="relative">
          <PosterCarousel posters={posters} fillViewport />
          <div
            aria-hidden="true"
            className="home-hero-bottom-vignette pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[46%]"
          />
          {hasLineupAnchor && (
            <div className="pointer-events-none absolute inset-x-0 bottom-12 z-20 flex flex-col items-center gap-2 px-5">
              <p className="ec-scroll-cue-twinkle text-center text-[15px] font-medium tracking-[0.02em] text-[rgba(255,255,255,0.78)]">
                스크롤하여 올해의 아티스트를 확인해보세요
              </p>
              <button
                type="button"
                onClick={scrollToLineupAnchor}
                aria-label="아티스트 섹션으로 이동"
                className="ec-scroll-cue-float pointer-events-auto inline-flex h-12 w-16 items-center justify-center text-[rgba(214,230,255,0.94)] drop-shadow-[0_7px_16px_rgba(0,0,0,0.42)] transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--on-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <svg
                  viewBox="0 0 64 24"
                  className="home-scroll-cue-arrow h-5 w-14"
                  aria-hidden="true"
                >
                  <path
                    d="M6 6 L32 18 L58 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
        <div
          ref={lineupAnchorRef}
          className="scroll-mt-0"
        >
          <div
            aria-hidden="true"
            className="h-[calc(env(safe-area-inset-top)+68px+var(--home-anchor-entry-gap))] bg-[var(--surface)]"
          />
          <LineupSection banners={lineups} />
        </div>
        <div className="mt-[var(--home-section-performance-margin-top)]">
          <CurrentPerformanceSection />
        </div>

        <div>
          <AdBanner ads={allAds} />
        </div>
      </div>

      {shouldShowInlineSpinner && (
        <DelayedSpinner
          delayMs={280}
          label="홈 콘텐츠 동기화 중"
          containerClassName="mx-auto mt-3 flex w-full max-w-[var(--home-content-max-width)] items-center justify-center py-2"
          spinnerClassName="h-4 w-4 border-[var(--home-card-border)] border-t-[var(--accent)]"
        />
      )}
    </div>
  )
}

export default Home
