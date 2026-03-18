import type { Pub } from "../types/boothmap.types";
import { ChevronRight } from "lucide-react"

export default function PubList({
  pubs,
  selectedCollegeId,
  onSelectPub,
}: {
  pubs: Pub[];
  selectedCollegeId: number | null;
  onSelectPub: (id: number) => void;
}) {

  if (!selectedCollegeId) {
    return (
      <div className="py-6 text-center text-sm font-semibold text-gray-400">
        단과대를 선택하면 주점이 보여요
      </div>
    );
  }

  if (pubs.length === 0) {
    return (
      <div className="py-6 text-center text-sm font-semibold text-gray-400">
        해당 단과대 주점이 아직 없어요
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {pubs.map((p) => (

        <button
          key={p.id}
          type="button"
          onClick={() => onSelectPub(p.id)}
          className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:shadow-md"
        >

          <div className="flex items-center gap-3">

            {/* 왼쪽 텍스트 */}
            <div className="flex-1 min-w-0">

              <div className="truncate text-base font-extrabold text-gray-900">
                {p.name}
              </div>

              {p.department && (
                <div className="mt-1 truncate text-sm font-semibold text-gray-500">
                  {p.department}
                </div>
              )}

              <div className="mt-1 line-clamp-2 text-sm font-medium text-gray-600">
                {p.intro ?? "소개가 아직 없어요"}
              </div>

              {p.instagram && (
                <div className="mt-2 text-xs font-bold text-blue-500">
                  {p.instagram}
                </div>
              )}

            </div>

            {/* 오른쪽 썸네일 */}
            {p.mainImageUrl && (
              <img
                src={p.mainImageUrl}
                loading="lazy"
                alt={p.name}
                className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
              />
            )}

            {/* chevron */}
            <ChevronRight className="text-gray-400 w-5 h-5" />

          </div>

        </button>

      ))}

    </div>
  );
}
