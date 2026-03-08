// 카카오맵 연동 전, 지도 영역을 대신하는 플레이스홀더 컴포넌트

import type { MapMode } from "../types/boothmap.types";

export default function KakaoMapPlaceholder({ mode }: { mode: MapMode }) {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />
      <div className="absolute left-3 top-3 rounded-xl border border-gray-200 bg-white/90 px-3 py-2 text-xs font-extrabold text-gray-700 shadow-sm">
        {mode === "2D" ? "지도(2D) - 붙이기 전" : "지도(3D) - 옵션 탭"}
      </div>
    </div>
  );
}