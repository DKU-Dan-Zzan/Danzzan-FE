// ALL/주점/푸드트럭/체험/편의시설 필터 칩 컴포넌트

import type { PrimaryFilter } from "../types/boothmap.types";

const chips: Array<{ label: string; value: PrimaryFilter }> = [
  { label: "ALL", value: "ALL" },
  { label: "주점", value: "PUB" },
  { label: "FoodTruck", value: "FOOD_TRUCK" },
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
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((c) => {
        const active = value === c.value;
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            className={[
              "shrink-0 rounded-full px-4 py-2 text-sm font-extrabold border transition",
              active
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-900 border-gray-200",
            ].join(" ")}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}