// 지도 위에 부스/단과대 마커를 임시로 올려보는 오버레이 컴포넌트

import type { Booth, College, PrimaryFilter, SelectedItem } from "../types/boothmap.types";

function typeColor(type: string) {
  if (type === "FOOD_TRUCK") return "bg-red-500";
  if (type === "EXPERIENCE") return "bg-emerald-500";
  if (type === "FACILITY") return "bg-blue-500";
  return "bg-gray-500";
}

// ※ 지금은 진짜 좌표(lng/lat) → 화면 좌표 변환을 안 하고, 임시로 "분포"만 보여줍니다.
function pseudoPosition(index: number, total: number) {
  const t = total <= 1 ? 0.5 : index / (total - 1);
  const x = 0.18 + 0.64 * (0.2 + 0.8 * Math.sin((t + 0.2) * Math.PI));
  const y = 0.18 + 0.64 * (0.2 + 0.8 * Math.cos((t + 0.15) * Math.PI));
  return { left: `${x * 100}%`, top: `${y * 100}%` };
}

export default function MapMarkersOverlay({
  booths,
  colleges,
  primaryFilter,
  selectedItem,
  onClickBooth,
  onClickCollege,
}: {
  booths: Booth[];
  colleges: College[];
  primaryFilter: PrimaryFilter;
  selectedItem: SelectedItem;
  onClickBooth: (id: number) => void;
  onClickCollege: (id: number) => void;
}) {
  return (
    <div className="absolute inset-0">
      {/* 부스 마커 */}
      {primaryFilter !== "PUB" &&
        booths.map((b, idx) => {
          const pos = pseudoPosition(idx, booths.length);
          const active = selectedItem?.kind === "booth" && selectedItem.id === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onClickBooth(b.id)}
              className={[
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-4 transition shadow-sm",
                active ? "border-gray-900 scale-110" : "border-white hover:scale-105",
                "h-9 w-9",
                typeColor(b.type),
              ].join(" ")}
              style={pos}
              aria-label={b.name}
              title={b.name}
            />
          );
        })}

      {/* 단과대 마커(주점 모드) */}
      {primaryFilter === "PUB" &&
        colleges.map((c, idx) => {
          const pos = pseudoPosition(idx, colleges.length);
          const active = selectedItem?.kind === "college" && selectedItem.id === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onClickCollege(c.id)}
              className={[
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-4 transition shadow-sm",
                active ? "border-gray-900 scale-110" : "border-white hover:scale-105",
                "h-10 w-10 bg-indigo-600",
              ].join(" ")}
              style={pos}
              aria-label={c.name}
              title={c.name}
            />
          );
        })}
    </div>
  );
}