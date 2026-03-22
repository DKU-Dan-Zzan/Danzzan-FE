import { useMemo } from "react"

import PosterCarousel, { type Poster } from "@/components/app/home/PosterCarousel"
import EmergencyNotice, { type EmergencyNoticeData } from "@/components/app/home/EmergencyNotice"
import LineupSection, { type LineupBanner } from "@/components/app/home/LineupSection"
import CurrentPerformanceSection from "@/components/app/home/CurrentPerformanceSection";
import AdBanner from "@/components/app/home/AdBanner";

import { getEmergencyNotice, getHomeImages, getLineupImages } from "@/api/app/home/homeApi"
import { getPlacementAd } from "@/api/app/notice/noticeApi"
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

  const homeBottomAdQuery = useAppQuery({
    queryKey: appQueryKeys.homeBottomAd(),
    queryFn: ({ signal }) => getPlacementAd("HOME_BOTTOM", { signal }),
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

  const loading =
    imagesQuery.isPending ||
    lineupQuery.isPending ||
    emergencyNoticeQuery.isPending ||
    homeBottomAdQuery.isPending

  const error =
    imagesQuery.error?.message ??
    lineupQuery.error?.message ??
    emergencyNoticeQuery.error?.message ??
    null

  const handleRetryAll = () => {
    void imagesQuery.refetch()
    void lineupQuery.refetch()
    void emergencyNoticeQuery.refetch()
    void homeBottomAdQuery.refetch()
  }

  return (
    <div className="home-root flow-root min-h-full bg-[var(--bg-page-soft)]">
      {error && (
        <div className="mx-auto mt-3 w-full max-w-[var(--home-content-max-width)] rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-xs leading-[1.35] text-[var(--status-danger-text)]">
          <div>{error}</div>
          <button
            type="button"
            onClick={handleRetryAll}
            className="mt-2 rounded-md border border-[var(--status-danger-border)] bg-[var(--surface)] px-2 py-1 text-[11px] font-semibold text-[var(--status-danger-text)]"
          >
            다시 시도
          </button>
        </div>
      )}

      <div>
        <EmergencyNotice notice={notice} />
        <div className="mt-[var(--home-section-poster-margin-top)]">
          <PosterCarousel posters={posters} />
        </div>
        <LineupSection banners={lineups} />
        <div className="mt-[var(--home-section-performance-margin-top)]">
          <CurrentPerformanceSection />
        </div>

        <div>
          <AdBanner imageUrl={homeBottomAdQuery.data?.imageUrl} alt={homeBottomAdQuery.data?.title} />
        </div>
      </div>

      {loading && (
        <div className="mx-auto mt-3 w-full max-w-[var(--home-content-max-width)] rounded-xl border border-[var(--home-card-border)] bg-[var(--home-card-bg)] px-3 py-2 text-xs leading-[1.35] text-[var(--text-muted)]">
          로딩 중...
        </div>
      )}
    </div>
  )
}

export default Home
