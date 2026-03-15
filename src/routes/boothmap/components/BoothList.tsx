// 부스(푸드트럭/체험/편의시설) 목록을 렌더링하는 리스트 컴포넌트

import type { Booth } from "../types/boothmap.types";

const typeLabel: Record<string, string> = {
  FOOD_TRUCK: "FOOD_TRUCK",
  EXPERIENCE: "EXPERIENCE",
  FACILITY: "FACILITY",
};

export default function BoothList({
  booths,
  onSelectBooth,
}: {
  booths: Booth[];
  onSelectBooth: (id: number) => void;
}) {
  if (booths.length === 0) {
    return <div className="py-6 text-center text-sm font-semibold text-gray-400">표시할 부스가 없어요</div>;
  }

  return (
    <div className="space-y-3">
      {booths.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => onSelectBooth(b.id)}
          className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
        >
          <div className="truncate text-base font-extrabold text-gray-900">{b.name}</div>
          <div className="mt-1 line-clamp-2 text-sm font-medium text-gray-600">
            {b.description ?? "설명이 아직 없어요"}
          </div>
          <div className="mt-3 text-xs font-bold text-gray-400">{typeLabel[b.type]}</div>
        </button>
      ))}
    </div>
  );
}