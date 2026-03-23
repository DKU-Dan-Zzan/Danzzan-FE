// 역할: boothmap 화면에서 사용하는 Map Floating Toggle UI 블록을 렌더링합니다.
// 지도 위에 떠 있는 2D/3D 전환용 작은 플로팅 토글 컴포넌트

import type { MapMode } from "@/types/app/boothmap/boothmap.types";

const MODE_BUTTON_ACTIVE_CLASS = "text-[var(--boothmap-accent-text)]";
const MODE_BUTTON_INACTIVE_CLASS =
  "bg-[var(--boothmap-surface-muted)] text-[var(--boothmap-text)] hover:bg-[var(--boothmap-overlay-label-bg)]";
const MODE_THUMB_CLASS =
  "pointer-events-none absolute left-0.5 top-0.5 h-8 w-12 rounded-full bg-[var(--boothmap-accent-soft)] shadow-[inset_0_0_0_1px_var(--boothmap-selected-ring)] transition-transform duration-300 ease-out";

export default function MapFloatingToggle({
  mode,
  onChange,
}: {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
}) {
  return (
    <div className="relative inline-flex items-center gap-0 rounded-full border border-[var(--boothmap-border)] bg-[var(--boothmap-surface)] p-0.5 shadow-[var(--boothmap-panel-shadow)]">
      <span
        aria-hidden="true"
        className={[
          MODE_THUMB_CLASS,
          mode === "2D" ? "translate-x-0" : "translate-x-12",
        ].join(" ")}
      />

      <button
        type="button"
        onClick={() => onChange("2D")}
        aria-label="2D 지도 보기"
        aria-pressed={mode === "2D"}
        className={[
          "relative z-10 h-8 w-12 rounded-full px-2 py-1 text-xs font-semibold leading-none transition-colors duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
          mode === "2D" ? MODE_BUTTON_ACTIVE_CLASS : MODE_BUTTON_INACTIVE_CLASS,
        ].join(" ")}
      >
        2D
      </button>

      <button
        type="button"
        onClick={() => onChange("3D")}
        aria-label="3D 지도 보기"
        aria-pressed={mode === "3D"}
        className={[
          "relative z-10 h-8 w-12 rounded-full px-2 py-1 text-xs font-semibold leading-none transition-colors duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
          mode === "3D" ? MODE_BUTTON_ACTIVE_CLASS : MODE_BUTTON_INACTIVE_CLASS,
        ].join(" ")}
      >
        3D
      </button>
    </div>
  );
}
