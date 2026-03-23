// 역할: boothmap 화면에서 사용하는 Secondary College Chips UI 블록을 렌더링합니다.
// 주점 선택 시 단과대 secondary filter를 보여주는 칩 컴포넌트

import type { College } from "@/types/app/boothmap/boothmap.types";

const CHIP_BASE_CLASS =
  "shrink-0 rounded-full border px-4 py-2 text-sm font-extrabold transition";
const CHIP_ACTIVE_CLASS =
  "border-[var(--boothmap-marker-pub)] bg-[var(--boothmap-marker-pub)] text-[var(--boothmap-overlay-badge-text)] shadow-[0_1px_2px_var(--boothmap-overlay-shadow)]";
const CHIP_INACTIVE_CLASS =
  "border-[var(--boothmap-border)] bg-[var(--boothmap-surface)] text-[var(--boothmap-text-subtle)] hover:border-[var(--boothmap-marker-pub)] hover:text-[var(--boothmap-text)]";

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
          CHIP_BASE_CLASS,
          selectedCollegeId === null ? CHIP_ACTIVE_CLASS : CHIP_INACTIVE_CLASS,
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
              CHIP_BASE_CLASS,
              active ? CHIP_ACTIVE_CLASS : CHIP_INACTIVE_CLASS,
            ].join(" ")}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
