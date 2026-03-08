// 주점(PUB) 모드에서 단과대(secondary filter)를 선택하는 칩 컴포넌트

import type { College } from "../types/boothmap.types";

export default function SecondaryCollegeChips({
  visible,
  colleges,
  selectedCollegeId,
  onSelect,
}: {
  visible: boolean;
  colleges: College[];
  selectedCollegeId: number | null;
  onSelect: (idOrNull: number | null) => void;
}) {
  if (!visible) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={[
          "shrink-0 rounded-full px-4 py-2 text-sm font-extrabold border transition",
          selectedCollegeId === null
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-gray-900 border-gray-200",
        ].join(" ")}
      >
        전체
      </button>

      {colleges.map((c) => {
        const active = selectedCollegeId === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={[
              "shrink-0 rounded-full px-4 py-2 text-sm font-extrabold border transition",
              active
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-900 border-gray-200",
            ].join(" ")}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}