// 역할: boothmap 화면에서 사용하는 Primary Filter Chips UI 블록을 렌더링합니다.
// ALL/주점/푸드트럭/체험/편의시설 1차 필터 칩 컴포넌트입니다.

import { cn } from "@/components/common/ui/utils";
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
  "shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-bold tracking-[-0.01em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--boothmap-surface)]";
const CHIP_ACTIVE_CLASS =
  "border-[var(--boothmap-chip-selected-border)] bg-[var(--boothmap-chip-selected-bg)] text-[var(--boothmap-chip-selected-text)] shadow-[var(--boothmap-chip-selected-shadow)]";
const CHIP_INACTIVE_CLASS =
  "border-[var(--boothmap-chip-border)] bg-[var(--boothmap-chip-bg)] text-[var(--boothmap-chip-text)] hover:border-[var(--boothmap-chip-hover-border)] hover:bg-[var(--boothmap-chip-hover-bg)] hover:text-[var(--boothmap-chip-hover-text)]";

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
                className={cn(
                  CHIP_BASE_CLASS,
                  active ? CHIP_ACTIVE_CLASS : CHIP_INACTIVE_CLASS,
                )}
              >
                {c.label}
              </button>
          );
        })}
      </div>
    </div>
  );
}
