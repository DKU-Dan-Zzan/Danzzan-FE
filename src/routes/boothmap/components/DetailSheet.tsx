import { useEffect, useRef, useState } from "react"
import type { Booth, College, Pub, SelectedDetailItem } from "../types/boothmap.types"
import {
  getBoothSummary,
  getPubDetail,
  type BoothSummaryResponse,
  type PubDetailResponse,
} from "../../../api/boothmapApi"

export default function DetailSheet({
  selectedItem,
  booths,
  pubs,
  colleges,
  onClose,
}: {
  selectedItem: SelectedDetailItem
  booths: Booth[]
  pubs: Pub[]
  colleges: College[]
  onClose: () => void
}) {
  const [viewerImage, setViewerImage] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const [boothDetail, setBoothDetail] = useState<BoothSummaryResponse | null>(null)
  const [pubDetail, setPubDetail] = useState<PubDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  // 간단한 상세 캐시
  const boothCacheRef = useRef<Map<number, BoothSummaryResponse>>(new Map())
  const pubCacheRef = useRef<Map<number, PubDetailResponse>>(new Map())

  // 선택 항목이 바뀌면 뷰어/슬라이드 상태 초기화
  useEffect(() => {
    setViewerImage(null)
    setCurrentIndex(0)
  }, [selectedItem])

  useEffect(() => {
    if (!selectedItem) {
      setBoothDetail(null)
      setPubDetail(null)
      return
    }

    const item = selectedItem
    let isMounted = true

    async function fetchDetail() {
      try {
        setIsLoading(true)
        setIsError(false)

        if (item.kind === "booth") {
          setPubDetail(null)

          const cached = boothCacheRef.current.get(item.id)
          if (cached) {
            if (!isMounted) return
            setBoothDetail(cached)
            return
          }

          const data = await getBoothSummary(item.id)
          if (!isMounted) return

          boothCacheRef.current.set(item.id, data)
          setBoothDetail(data)
          return
        }

        if (item.kind === "pub") {
          setBoothDetail(null)

          const cached = pubCacheRef.current.get(item.id)
          if (cached) {
            if (!isMounted) return
            setPubDetail(cached)
            return
          }

          const data = await getPubDetail(item.id)
          if (!isMounted) return

          pubCacheRef.current.set(item.id, data)
          setPubDetail(data)
        }
      } catch (error) {
        console.error("상세 정보 조회 실패", error)
        if (!isMounted) return
        setIsError(true)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchDetail()

    return () => {
      isMounted = false
    }
  }, [selectedItem])

  if (!selectedItem) {
    return (
      <div className="py-6 text-center text-sm font-semibold text-gray-400">
        선택된 항목이 없어요
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 h-44 w-full animate-pulse rounded-xl bg-gray-200" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
        <div className="text-sm font-semibold text-red-500">
          상세 정보를 불러오지 못했어요
        </div>
        <button
          onClick={onClose}
          className="mt-4 rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700"
        >
          닫기
        </button>
      </div>
    )
  }

  if (selectedItem.kind === "booth" && boothDetail) {
    // fallback 용: 기존 배열에서 좌표/타입 등 다른 정보 찾고 싶을 때 쓸 수 있음
    const booth = booths.find((x) => x.id === selectedItem.id)

    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-lg font-extrabold text-gray-900">
                {boothDetail.name}
              </div>

              {booth?.type && (
                <div className="text-sm font-bold text-gray-500">
                  {booth.type}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ✕
            </button>
          </div>

          {boothDetail.imageUrl && (
            <div className="mt-3 rounded-xl bg-gray-100 p-2">
              <img
                src={boothDetail.imageUrl}
                loading="lazy"
                onClick={() => setViewerImage(boothDetail.imageUrl)}
                className="mx-auto max-h-[320px] w-auto max-w-full rounded-xl object-contain cursor-pointer"
              />
            </div>
          )}

          <div className="mt-4 text-sm font-medium leading-6 text-gray-700">
            {boothDetail.description || "설명이 아직 없어요"}
          </div>
        </div>

        {viewerImage && (
          <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90"
            onClick={() => setViewerImage(null)}
          >
            <img
              src={viewerImage}
              className="max-h-[90%] max-w-[90%] rounded-xl"
            />
          </div>
        )}
      </div>
    )
  }

  if (selectedItem.kind === "pub" && pubDetail) {
    // 기존 summary 데이터는 fallback 용
    const summaryPub = pubs.find((x) => x.id === selectedItem.id)
    const fallbackCollege =
      colleges.find((c) => c.id === summaryPub?.college_id)?.name ?? "단과대"

    const displayCollege = pubDetail.collegeName || fallbackCollege
    const imageUrls = pubDetail.imageUrls ?? []

    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          {/* 헤더 */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-lg font-extrabold text-gray-900">
                {pubDetail.name}
              </div>

              <div className="text-sm font-bold text-gray-500">
                {displayCollege}
                {pubDetail.department ? ` · ${pubDetail.department}` : ""}
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ✕
            </button>
          </div>

          {/* 이미지 슬라이드 */}
          {imageUrls.length > 0 && (
            <div className="mt-3">
              <div
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                onScroll={(e) => {
                  const el = e.currentTarget
                  const itemWidth = el.clientWidth * 0.85 + 12
                  const index = Math.round(el.scrollLeft / itemWidth)
                  setCurrentIndex(index)
                }}
              >
                {imageUrls.map((img, i) => (
                  <div
                    key={i}
                    className="w-[85%] flex-shrink-0 snap-start"
                  >
                    <img
                      src={img}
                      loading="lazy"
                      onClick={() => setViewerImage(img)}
                      className="w-full rounded-xl object-contain cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-2 flex justify-center gap-1">
                {imageUrls.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full ${
                      currentIndex === i ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* intro */}
          {pubDetail.intro && (
            <div className="mt-4 rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
              {pubDetail.intro}
            </div>
          )}

          {/* description */}
          <div className="mt-4 text-sm font-medium leading-6 text-gray-700">
            {pubDetail.description || summaryPub?.intro || "설명이 아직 없어요"}
          </div>

          {/* instagram */}
          {pubDetail.instagram && (
            <a
              href={
                pubDetail.instagram.startsWith("http")
                  ? pubDetail.instagram
                  : `https://instagram.com/${pubDetail.instagram.replace("@", "")}`
              }
              target="_blank"
              rel="noreferrer"
              className="mt-4 block text-sm font-extrabold text-blue-600 underline underline-offset-2"
            >
              {pubDetail.instagram}
            </a>
          )}
        </div>

        {/* Fullscreen viewer */}
        {viewerImage && (
          <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90"
            onClick={() => setViewerImage(null)}
          >
            <img
              src={viewerImage}
              className="max-h-[90%] max-w-[90%] rounded-xl"
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="py-6 text-center text-sm font-semibold text-gray-400">
      표시할 상세 정보가 없어요
    </div>
  )
}
