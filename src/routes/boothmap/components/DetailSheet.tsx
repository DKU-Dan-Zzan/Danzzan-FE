import { useState } from "react"
import type { Booth, College, Pub, SelectedDetailItem } from "../types/boothmap.types"

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

  if (!selectedItem) {
    return (
      <div className="py-6 text-center text-sm font-semibold text-gray-400">
        선택된 항목이 없어요
      </div>
    )
  }

  if (selectedItem.kind === "pub") {

    const p = pubs.find((x) => x.id === selectedItem.id)
    if (!p) return null

    const college =
      colleges.find((c) => c.id === p.college_id)?.name ?? "단과대"

    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">

          {/* 헤더 */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-lg font-extrabold text-gray-900">
                {p.name}
              </div>

              <div className="text-sm font-bold text-gray-500">
                {college}
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
          {p.images && p.images.length > 0 && (
            <div className="mt-3">

              <div
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory"
                onScroll={(e) => {
                  const el = e.currentTarget
                  const index = Math.round(el.scrollLeft / el.clientWidth)
                  setCurrentIndex(index)
                }}
              >
                {p.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    loading="lazy"
                    onClick={() => setViewerImage(img)}
                    className="h-44 w-[85%] flex-shrink-0 snap-start rounded-xl object-cover cursor-pointer"
                  />
                ))}
              </div>

              {/* dots */}
              <div className="mt-2 flex justify-center gap-1">
                {p.images.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full ${
                      currentIndex === i
                        ? "bg-blue-500"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 text-sm font-medium text-gray-700">
            {p.description ?? p.intro ?? "설명이 아직 없어요"}
          </div>

          {p.instagram && (
            <div className="mt-4 text-sm font-extrabold text-blue-600">
              {p.instagram}
            </div>
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

  return null
}