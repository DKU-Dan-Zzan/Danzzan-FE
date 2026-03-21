// ALL/주점/푸드트럭/체험/편의시설 1차 필터 칩 컴포넌트입니다.

import type { PrimaryFilter } from "@/types/app/boothmap/boothmap.types";

const chips: Array<{ label: string; value: PrimaryFilter }> = [
  { label: "ALL", value: "ALL" },
  { label: "주점", value: "PUB" },
  { label: "푸드트럭", value: "FOOD_TRUCK" },
  { label: "부스", value: "EXPERIENCE" },
  { label: "이벤트", value: "EVENT" },
  { label: "편의시설", value: "FACILITY" },
];

const CHIP_BASE_CLASS =
  "shrink-0 rounded-full border px-4 py-2 text-sm font-extrabold transition";
const CHIP_ACTIVE_CLASS =
  "border-[var(--boothmap-marker-pub)] bg-[var(--boothmap-marker-pub)] text-[var(--boothmap-overlay-badge-text)] shadow-[0_1px_2px_var(--boothmap-overlay-shadow)]";
const CHIP_INACTIVE_CLASS =
  "border-[var(--boothmap-border)] bg-[var(--boothmap-surface)] text-[var(--boothmap-text-subtle)] hover:border-[var(--boothmap-marker-pub)] hover:text-[var(--boothmap-text)]";

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
                CHIP_BASE_CLASS,
                active ? CHIP_ACTIVE_CLASS : CHIP_INACTIVE_CLASS,
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
