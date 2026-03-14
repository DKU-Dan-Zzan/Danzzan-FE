import { useEffect, useState } from "react"

import PosterCarousel, { type Poster } from "./components/PosterCarousel"
import LineupCarousel, { type LineupBanner } from "./components/LineupCarousel"
import EmergencyNotice, { type EmergencyNoticeData } from "./components/EmergencyNotice"

import { getEmergencyNotice, getHomeImages, getLineupImages } from "../../api/homeApi"

const dummyPosters: Poster[] = [
  { id: "p1", imageUrl: "/posters/dummy.jpg", alt: "2026 단국축제 포스터" },
]

function Home() {
  const [posters, setPosters] = useState<Poster[]>(dummyPosters)
  const [lineups, setLineups] = useState<LineupBanner[]>([])
  const [notice, setNotice] = useState<EmergencyNoticeData | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    ;(async () => {
      setLoading(true)
      setError(null)

      const [imagesResult, lineupResult, noticeResult] = await Promise.allSettled([
        getHomeImages(),
        getLineupImages(),
        getEmergencyNotice(),
      ])

      if (!alive) return

      if (imagesResult.status === "fulfilled" && imagesResult.value?.length > 0) {
        setPosters(
          imagesResult.value.map((img, idx) => ({
            id: String(img.id),
            imageUrl: img.imageUrl,
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

      setLoading(false)
    })()

    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="pb-24">
      {error && (
        <div className="px-4 mt-3 text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <EmergencyNotice notice={notice} />
        <PosterCarousel posters={posters} />
        <LineupCarousel banners={lineups} />
      </div>

      {loading && (
        <div className="px-4 mt-3 text-xs text-gray-400">
          로딩 중...
        </div>
      )}

      <div className="h-32" aria-hidden="true" />
    </div>
  )
}

export default Home
