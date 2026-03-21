// 부스(푸드트럭/체험/편의시설) 목록을 렌더링하는 리스트 컴포넌트

import type { Booth } from "@/types/app/boothmap/boothmap.types";

const typeLabel: Record<string, string> = {
  FOOD_TRUCK: "FOOD_TRUCK",
  EXPERIENCE: "EXPERIENCE",
  EVENT: "EVENT",
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
    return (
      <div className="py-6 text-center text-sm font-semibold text-[var(--boothmap-text-muted)]">
        표시할 부스가 없어요
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {booths.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => onSelectBooth(b.id)}
          className="w-full rounded-2xl border border-[var(--boothmap-border)] bg-[var(--boothmap-surface)] p-4 text-left shadow-sm transition hover:shadow-md"
        >
          <div className="truncate text-base font-extrabold text-[var(--boothmap-text)]">{b.name}</div>
          <div className="mt-1 line-clamp-2 text-sm font-medium text-[var(--boothmap-text-subtle)]">
            {b.description ?? "설명이 아직 없어요"}
          </div>
          <div className="mt-3 text-xs font-bold text-[var(--boothmap-text-muted)]">{typeLabel[b.type]}</div>
        </button>
      ))}
    </div>
  );
}
