// 선택된 단과대의 주점 리스트를 렌더링하는 컴포넌트

import type { Pub } from "../types/boothmap.types";

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
    return <div className="py-6 text-center text-sm font-semibold text-gray-400">단과대를 선택하면 주점이 보여요</div>;
  }

  if (pubs.length === 0) {
    return <div className="py-6 text-center text-sm font-semibold text-gray-400">해당 단과대 주점이 아직 없어요</div>;
  }

  return (
    <div className="space-y-3">
      {pubs.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelectPub(p.id)}
          className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
        >
          <div className="truncate text-base font-extrabold text-gray-900">{p.name}</div>
          <div className="mt-1 line-clamp-2 text-sm font-medium text-gray-600">
            {p.intro ?? "소개가 아직 없어요"}
          </div>
          <div className="mt-3 text-xs font-bold text-gray-400">{p.instagram ?? "@"}</div>
        </button>
      ))}
    </div>
  );
}