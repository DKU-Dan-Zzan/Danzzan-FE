// 주점 선택 시 단과대 secondary filter를 보여주는 칩 컴포넌트

import type { College } from "@/types/app/boothmap/boothmap.types";

const CHIP_BASE_CLASS =
  "shrink-0 rounded-full border px-4 py-2 text-sm font-extrabold transition";
const CHIP_ACTIVE_CLASS =
  "border-[var(--brand-main)] bg-[var(--brand-main)] text-[var(--text-on-accent)] shadow-[0_1px_2px_rgb(15_23_42/0.12)]";
const CHIP_INACTIVE_CLASS =
  "border-[var(--line-soft)] bg-[var(--surface-card)] text-[var(--text-muted)] hover:border-[var(--brand-soft)]/70 hover:text-[var(--text)]";

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
