// 지도 위에 떠 있는 2D/3D 전환용 작은 플로팅 토글 컴포넌트

import type { MapMode } from "@/types/app/boothmap/boothmap.types";

const MODE_BUTTON_ACTIVE_CLASS =
  "bg-[var(--boothmap-toggle-active-bg)] text-[var(--boothmap-overlay-badge-text)] shadow-[var(--boothmap-toggle-active-shadow)]";
const MODE_BUTTON_INACTIVE_CLASS =
  "bg-transparent text-[var(--boothmap-text-subtle)] hover:bg-[var(--boothmap-overlay-label-bg)] hover:text-[var(--boothmap-text)]";

export default function MapFloatingToggle({
  mode,
  onChange,
}: {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-[var(--boothmap-panel-border)] bg-[var(--boothmap-panel-bg)] p-1 shadow-[var(--boothmap-panel-shadow)] backdrop-blur-md">
      <button
        type="button"
        onClick={() => onChange("2D")}
        className={[
          "rounded-full px-3 py-2 text-[11px] font-extrabold transition",
          mode === "2D" ? MODE_BUTTON_ACTIVE_CLASS : MODE_BUTTON_INACTIVE_CLASS,
        ].join(" ")}
      >
        2D
      </button>

      <button
        type="button"
        onClick={() => onChange("3D")}
        className={[
          "rounded-full px-2.5 py-1.5 text-[10px] font-extrabold transition",
          mode === "3D" ? MODE_BUTTON_ACTIVE_CLASS : MODE_BUTTON_INACTIVE_CLASS,
        ].join(" ")}
      >
        3D
      </button>
    </div>
  );
}
