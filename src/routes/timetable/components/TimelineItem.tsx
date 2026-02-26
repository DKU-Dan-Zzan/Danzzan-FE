import { useState } from "react"
import type { Performance } from "../timetable.types"
import Pill from "./Pill"

export default function TimelineItem({
  item,
  isLast,
}: {
  item: Performance
  isLast: boolean
}) {
  const [open, setOpen] = useState(false)
  const [hh, mm] = item.startTime.split(":")

  return (
    <li className="relative flex gap-4">
      {/* 좌측 시간 배지 */}
      <div className="w-14 flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-white flex items-center justify-center shadow">
          <div className="text-center leading-none">
            <div className="text-lg font-extrabold">{hh}</div>
            <div className="text-sm font-semibold">{mm}</div>
          </div>
        </div>
      </div>

      {/* 중앙 라인/도트 */}
      <div className="relative w-6 flex justify-center">
        <div className="mt-6 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100" />
        {!isLast && <div className="absolute top-10 bottom-0 w-[2px] bg-gray-200" />}
      </div>

      {/* 우측 카드 */}
      <div className="flex-1">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start gap-3">
            <img
              src={item.artistImage || "/placeholder-artist.png"}
              alt=""
              className="w-12 h-12 rounded-xl object-cover bg-gray-100"
            />

            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-gray-900 truncate">
                {item.artistName}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <Pill icon="⏱" text={`${item.startTime} ~ ${item.endTime}`} />
                {item.stage && <Pill icon="📍" text={item.stage} tone="soft" />}
              </div>

              {item.artistDescription && (
                <div className="mt-3">
                  <p
                    className={[
                      "text-sm text-gray-600 leading-relaxed",
                      open ? "" : "line-clamp-2",
                    ].join(" ")}
                  >
                    {item.artistDescription}
                  </p>

                  <button
                    onClick={() => setOpen((v) => !v)}
                    className="mt-2 text-xs font-semibold text-blue-600"
                  >
                    {open ? "접기" : "더보기"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}