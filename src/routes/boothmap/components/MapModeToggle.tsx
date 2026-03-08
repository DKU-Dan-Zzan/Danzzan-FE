// 2D(카카오맵)/3D(옵션) 보기 모드를 전환하는 토글 컴포넌트

import type { MapMode } from "../types/boothmap.types";

export default function MapModeToggle({
  mode,
  onChange,
}: {
  mode: MapMode;
  onChange: (m: MapMode) => void;
}) {
  const base =
    "flex-1 rounded-xl px-4 py-2 text-sm font-extrabold transition border";
  const active = "bg-gray-900 text-white border-gray-900";
  const inactive = "bg-white text-gray-900 border-gray-200";

  return (
    <div className="flex w-full max-w-[420px] gap-2 rounded-2xl bg-white p-1 shadow-sm border border-gray-100">
      <button
        className={`${base} ${mode === "2D" ? active : inactive}`}
        onClick={() => onChange("2D")}
        type="button"
      >
        2D(카카오맵)
      </button>
      <button
        className={`${base} ${mode === "3D" ? active : inactive}`}
        onClick={() => onChange("3D")}
        type="button"
      >
        3D(옵션)
      </button>
    </div>
  );
}