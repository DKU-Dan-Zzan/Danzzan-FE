import { useEffect, useMemo, useState } from "react"
import { ENV } from "../../../config/env"

import PosterCarousel, { type Poster } from "./components/PosterCarousel"
import EmergencyNotice, { type EmergencyNoticeData } from "./components/EmergencyNotice"
import TicketingCtaCard from "./components/TicketingCtaCard"

import { getEmergencyNotice, getHomeImages } from "../../api/homeApi"

const dummyPosters: Poster[] = [
  { id: "p1", imageUrl: "/posters/dummy1.jpg", alt: "2026 단국축제 포스터 1" },
  { id: "p2", imageUrl: "/posters/dummy2.jpg", alt: "2026 단국축제 포스터 2" },
  { id: "p3", imageUrl: "/posters/dummy3.jpg", alt: "2026 단국축제 포스터 3" },
  { id: "p4", imageUrl: "/posters/dummy4.jpg", alt: "2026 단국축제 포스터 4" },
]

function Home() {
  const [posters, setPosters] = useState<Poster[]>(dummyPosters)
  const [notice, setNotice] = useState<EmergencyNoticeData | null>(null)

  // 간단 로딩/에러 상태
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const ticketingCta = useMemo(
    () => ({
      title: "단국존 티켓 (예매/확인)",
      subtitle: "지금 바로 티켓을 확보하세요 ✨",
      href: ENV.TICKETING_URL,
    }),
    []
  )

  useEffect(() => {
    let alive = true

    ;(async () => {
      setLoading(true)
      setError(null)

      const [imagesResult, noticeResult] = await Promise.allSettled([
        getHomeImages(),
        getEmergencyNotice(),
      ])

      if (!alive) return

      // 1) posters
      if (imagesResult.status === "fulfilled" && imagesResult.value?.length > 0) {
        setPosters(
          imagesResult.value.map((img, idx) => ({
            id: String(img.id),
            imageUrl: img.imageUrl,
            alt: `홈 포스터 ${idx + 1}`,
          }))
        )
      } else {
        // 실패 시 더미 유지
        if (imagesResult.status === "rejected") {
          setError(imagesResult.reason?.message ?? "홈 이미지 조회 실패")
        }
        setPosters(dummyPosters)
      }

      // 2) notice (null이면 숨김)
      if (noticeResult.status === "fulfilled" && noticeResult.value) {
        setNotice({
          id: noticeResult.value.id,
          title: "긴급 공지",
          content: noticeResult.value.content,
          isActive: Boolean(noticeResult.value.content?.trim()),
        })
      } else {
        // null 반환 or 실패 -> 숨김
        setNotice(null)
        if (noticeResult.status === "rejected") {
          setError((prev) => prev ?? (noticeResult.reason?.message ?? "긴급공지 조회 실패"))
        }
      }

      setLoading(false)
    })()

    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="pb-6">
      {/* 에러 표시 */}
      {error && (
        <div className="px-4 mt-3 text-xs text-red-600">
          {error}
        </div>
      )}

      <PosterCarousel posters={posters} />

      <EmergencyNotice notice={notice} />

      <TicketingCtaCard data={ticketingCta} />

      {/* 로딩 상태 */}
      {loading && (
        <div className="px-4 mt-3 text-xs text-gray-400">
          로딩 중...
        </div>
      )}
    </div>
  )
}

export default Home
