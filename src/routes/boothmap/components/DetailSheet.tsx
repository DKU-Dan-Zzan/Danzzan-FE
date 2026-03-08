// 선택된 아이템(부스/주점)의 상세 정보를 바텀시트에 표시하는 컴포넌트

import type { Booth, College, Pub, SelectedItem } from "../types/boothmap.types";

export default function DetailSheet({
  selectedItem,
  booths,
  pubs,
  colleges,
  onClose,
}: {
  selectedItem: SelectedItem;
  booths: Booth[];
  pubs: Pub[];
  colleges: College[];
  onClose: () => void;
}) {
  if (!selectedItem) {
    return <div className="py-6 text-center text-sm font-semibold text-gray-400">선택된 항목이 없어요</div>;
  }

  const header = (
    <div className="flex items-center justify-between pb-2">
      <div className="text-base font-extrabold text-gray-900">상세 정보</div>
      <button type="button" onClick={onClose} className="text-sm font-extrabold text-gray-500">
        닫기
      </button>
    </div>
  );

  if (selectedItem.kind === "booth") {
    const b = booths.find((x) => x.id === selectedItem.id);
    if (!b) return <div className="py-6 text-center text-sm font-semibold text-gray-400">부스를 찾을 수 없어요</div>;
    return (
      <div className="space-y-3">
        {header}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-lg font-extrabold text-gray-900">{b.name}</div>
          <div className="mt-2 text-sm font-medium text-gray-700">{b.description ?? "설명이 아직 없어요"}</div>
          <div className="mt-4 text-xs font-bold text-gray-400">{b.type}</div>
        </div>
      </div>
    );
  }

  if (selectedItem.kind === "pub") {
    const p = pubs.find((x) => x.id === selectedItem.id);
    if (!p) return <div className="py-6 text-center text-sm font-semibold text-gray-400">주점을 찾을 수 없어요</div>;
    const college = colleges.find((c) => c.id === p.college_id)?.name ?? "단과대";
    return (
      <div className="space-y-3">
        {header}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-lg font-extrabold text-gray-900">{p.name}</div>
          <div className="mt-1 text-sm font-bold text-gray-500">{college}</div>
          <div className="mt-3 text-sm font-medium text-gray-700">{p.description ?? p.intro ?? "설명이 아직 없어요"}</div>
          <div className="mt-4 text-sm font-extrabold text-blue-600">{p.instagram ?? ""}</div>
        </div>
      </div>
    );
  }

  // college 상세는 지금 단계에서는 생략(필요하면 추가 가능)
  return (
    <div className="space-y-3">
      {header}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm font-medium text-gray-700 shadow-sm">
        단과대 마커가 선택됐어요. 주점 리스트를 확인해줘.
      </div>
    </div>
  );
}