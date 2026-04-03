import type { College } from "@/types/app/boothmap/boothmap.types";

const CHIP_BASE_CLASS =
  "shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-bold tracking-[-0.01em] transition";
const CHIP_ACTIVE_CLASS =
  "border-[var(--boothmap-chip-selected-border)] bg-[var(--boothmap-chip-selected-bg)] text-[var(--boothmap-chip-selected-text)] shadow-[var(--boothmap-chip-selected-shadow)]";
const CHIP_INACTIVE_CLASS =
  "border-[var(--boothmap-chip-border)] bg-[var(--boothmap-chip-bg)] text-[var(--boothmap-chip-text)] hover:border-[var(--boothmap-chip-hover-border)] hover:bg-[var(--boothmap-chip-hover-bg)] hover:text-[var(--boothmap-chip-hover-text)]";

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

      {colleges.map((college) => {
        const active = selectedCollegeId === college.id;

        return (
          <button
            key={college.id}
            type="button"
            onClick={() => onSelect(college.id)}
            className={[
              CHIP_BASE_CLASS,
              active ? CHIP_ACTIVE_CLASS : CHIP_INACTIVE_CLASS,
            ].join(" ")}
          >
            {college.name}
          </button>
        );
      })}
    </div>
  );
}
