// 지도 위에 떠 있는 2D/3D 전환용 작은 플로팅 토글 컴포넌트

import type { MapMode } from "@/types/app/boothmap/boothmap.types";

const MODE_BUTTON_ACTIVE_CLASS =
  "bg-[linear-gradient(145deg,var(--brand-main)_0%,var(--accent)_100%)] text-[var(--text-on-accent)] shadow-[0_10px_18px_rgba(10,85,156,0.26)]";
const MODE_BUTTON_INACTIVE_CLASS =
  "bg-transparent text-[var(--text-muted)] hover:bg-white/80 hover:text-[var(--text)]";

export default function MapFloatingToggle({
  mode,
  onChange,
}: {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/70 bg-white/95 p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md">
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
