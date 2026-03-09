// ALL/주점/푸드트럭/체험/편의시설 1차 필터 칩 컴포넌트입니다.

import type { PrimaryFilter } from "../types/boothmap.types";

const chips: Array<{ label: string; value: PrimaryFilter }> = [
  { label: "ALL", value: "ALL" },
  { label: "주점", value: "PUB" },
  { label: "푸드트럭", value: "FOOD_TRUCK" },
  { label: "체험", value: "EXPERIENCE" },
  { label: "편의시설", value: "FACILITY" },
];

export default function PrimaryFilterChips({
  value,
  onChange,
}: {
  value: PrimaryFilter;
  onChange: (v: PrimaryFilter) => void;
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-2">
        {chips.map((c) => {
          const active = value === c.value;

          return (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange(c.value)}
              className={[
                "shrink-0 rounded-full border px-4 py-2 text-sm font-extrabold transition",
                active
                  ? "border-[#0a559c] bg-[#0a559c] text-white shadow-sm"
                  : "border-gray-200 bg-white text-gray-500",
              ].join(" ")}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}