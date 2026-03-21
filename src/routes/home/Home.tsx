import { useEffect, useState } from "react"

import PosterCarousel, { type Poster } from "@/components/app/home/PosterCarousel"
import EmergencyNotice, { type EmergencyNoticeData } from "@/components/app/home/EmergencyNotice"
import LineupSection, { type LineupBanner } from "@/components/app/home/LineupSection"
import CurrentPerformanceSection from "@/components/app/home/CurrentPerformanceSection";
import AdBanner from "@/components/app/home/AdBanner";
import "./index.css";

import { getEmergencyNotice, getHomeImages, getLineupImages } from "@/api/app/home/homeApi"
import { getPlacementAd, type ClientAdDto } from "@/api/app/notice/noticeApi"

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
  const [posters, setPosters] = useState<Poster[]>(dummyPosters)
  const [lineups, setLineups] = useState<LineupBanner[]>([])
  const [notice, setNotice] = useState<EmergencyNoticeData | null>(null)
  const [homeBottomAd, setHomeBottomAd] = useState<ClientAdDto | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    ;(async () => {
      setLoading(true)
      setError(null)

      const [imagesResult, lineupResult, noticeResult, homeBottomAdResult] = await Promise.allSettled([
        getHomeImages(),
        getLineupImages(),
        getEmergencyNotice(),
        getPlacementAd("HOME_BOTTOM"),
      ])

      if (!alive) return

      if (imagesResult.status === "fulfilled" && imagesResult.value?.length > 0) {
        setPosters(
          imagesResult.value.map((img, idx) => ({
            id: `${img.id}-${img.version?.trim() || getVersionFromImageUrl(img.imageUrl) || "noversion"}`,
            imageUrl: withImageVersion(img.imageUrl, img.version),
            alt: `포스터 ${idx + 1}`,
          }))
        )
      } else {
        if (imagesResult.status === "rejected") {
          setError(imagesResult.reason?.message ?? "홈 이미지 조회 실패")
        }
        setPosters(dummyPosters)
      }

      if (lineupResult.status === "fulfilled" && lineupResult.value?.length > 0) {
        setLineups(
          lineupResult.value.map((img, idx) => ({
            id: String(img.id),
            imageUrl: img.imageUrl,
            alt: `라인업 이미지 ${idx + 1}`,
          }))
        )
      } else {
        if (lineupResult.status === "rejected") {
          setError((prev) => prev ?? (lineupResult.reason?.message ?? "라인업 이미지 조회 실패"))
        }
        setLineups([])
      }

      if (noticeResult.status === "fulfilled" && noticeResult.value) {
        setNotice({
          id: noticeResult.value.id,
          title: "긴급공지 및 내용",
          content: noticeResult.value.content,
          updatedAt: noticeResult.value.updatedAt,
        })
      } else {
        setNotice(null)
        if (noticeResult.status === "rejected") {
          setError((prev) => prev ?? (noticeResult.reason?.message ?? "긴급 공지 조회 실패"))
        }
      }

      if (homeBottomAdResult.status === "fulfilled") {
        setHomeBottomAd(homeBottomAdResult.value ?? null)
      } else {
        setHomeBottomAd(null)
      }

      setLoading(false)
    })()

    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="home-root flow-root min-h-full bg-[var(--bg-page-soft)]">
      {error && (
        <div className="mx-auto mt-3 w-full max-w-[var(--home-content-max-width)] rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-xs leading-[1.35] text-[var(--status-danger-text)]">
          {error}
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
          <AdBanner imageUrl={homeBottomAd?.imageUrl} alt={homeBottomAd?.title} />
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
