// 주점 선택 시 단과대 secondary filter를 보여주는 칩 컴포넌트

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
          "shrink-0 rounded-full border px-4 py-2 text-sm font-extrabold transition",
          selectedCollegeId === null
            ? "border-[#0a559c] bg-[#0a559c] text-white shadow-sm"
            : "border-gray-200 bg-white text-gray-500",
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
              "shrink-0 rounded-full border px-4 py-2 text-sm font-extrabold transition",
              active
                ? "border-[#0a559c] bg-[#0a559c] text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-500",
            ].join(" ")}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}